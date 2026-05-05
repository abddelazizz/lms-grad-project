import { Course, Enrollment, Review, CourseSection, LessonContent, User, AssignmentSubmission } from "../models/index.js";
import { sequelize } from "../config/index.js";
import { Op } from "sequelize";
import { catchAsync, AppError } from "../utils/index.js";

export const getDashboardStats = catchAsync(async (req, res) => {
  const instructorId = req.user.user_id;

  const courses = await Course.findAll({
    where: { instructor_id: instructorId },
    attributes: ["course_id", "title", "status", "price", "thumbnail_url", "level"],
    include: [
      {
        model: Enrollment,
        as: "enrollments",
        attributes: ["status", "progress_percentage", "enrolled_at"],
      },
      {
        model: Review,
        as: "reviews",
        attributes: ["rating"],
      },
      {
        model: CourseSection,
        as: "sections",
        attributes: ["section_id"],
        include: [
          {
            model: LessonContent,
            as: "lessons",
            attributes: ["content_id"],
          },
        ],
      },
    ],
  });

  let totalStudents = 0;
  let totalRevenue = 0;
  let totalRatings = 0;
  let ratingsCount = 0;
  const monthlyData = {};

  const courseStats = courses.map((course) => {
    const activeEnrollments = course.enrollments.filter(
      (e) => e.status === "active"
    ).length;
    const completedEnrollments = course.enrollments.filter(
      (e) => e.status === "completed"
    ).length;
    const revenue = parseFloat(course.price) * course.enrollments.length;

    const avgRating =
      course.reviews.length > 0
        ? (
            course.reviews.reduce((sum, r) => sum + r.rating, 0) /
            course.reviews.length
          ).toFixed(1)
        : null;

    // Calculate average progress for this course
    const avgProgress = course.enrollments.length > 0
      ? (course.enrollments.reduce((sum, e) => sum + parseFloat(e.progress_percentage || 0), 0) / course.enrollments.length).toFixed(0)
      : 0;

    totalStudents += course.enrollments.length;
    totalRevenue += revenue;
    course.reviews.forEach((r) => {
      totalRatings += r.rating;
      ratingsCount++;
    });

    // Populate monthly data for chart
    course.enrollments.forEach(e => {
      const month = new Date(e.enrolled_at).toLocaleString('default', { month: 'short' });
      monthlyData[month] = (monthlyData[month] || 0) + 1;
    });

    const total_sections = course.sections ? course.sections.length : 0;
    const total_lessons = course.sections
      ? course.sections.reduce((sum, s) => sum + (s.lessons ? s.lessons.length : 0), 0)
      : 0;

    return {
      course_id: course.course_id,
      title: course.title,
      status: course.status,
      level: course.level || 'beginner',
      thumbnail_url: course.thumbnail_url || null,
      total_sections,
      total_lessons,
      enrollments: {
        total: course.enrollments.length,
        active: activeEnrollments,
        completed: completedEnrollments,
      },
      revenue,
      price: course.price,
      avg_rating: avgRating,
      total_reviews: course.reviews.length,
      avg_progress: avgProgress,
      enrollments_raw: course.enrollments
    };
  });

  const overallAvgRating =
    ratingsCount > 0 ? (totalRatings / ratingsCount).toFixed(1) : null;

  // Fetch pending assignments as activities
  const pendingAssignments = await AssignmentSubmission.findAll({
    where: {
      status: "pending",
      content_id: {
        [Op.in]: sequelize.literal(`(SELECT content_id FROM lesson_contents WHERE section_id IN (SELECT section_id FROM course_sections WHERE course_id IN (${courses.map(c => c.course_id).join(',') || 0})))`)
      }
    },
    include: [
      { model: User, as: "student", attributes: ["name", "picture"] },
      { model: LessonContent, as: "lessonContent", attributes: ["title"] }
    ],
    order: [["submitted_at", "DESC"]],
    limit: 5
  });

  // Fetch recent unique students
  const recentEnrollments = await Enrollment.findAll({
    where: {
      course_id: { [Op.in]: courses.map((c) => c.course_id).length > 0 ? courses.map((c) => c.course_id) : [0] },
    },
    include: [
      {
        model: User,
        as: "student",
        attributes: ["user_id", "name", "picture", "email"],
      },
    ],
    order: [["enrolled_at", "DESC"]],
    limit: 10,
  });

  const uniqueStudents = Array.from(
    new Map(
      recentEnrollments
        .filter((e) => e.student)
        .map((e) => [e.student.user_id, e.student])
    ).values()
  ).slice(0, 5);

  // Fetch activity for last 7 days
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    last7Days.push(d.toISOString().split('T')[0]);
  }

  const dailyActivity = {};
  last7Days.forEach(date => dailyActivity[date] = 0);

  // Add enrollments to activity
  courseStats.forEach(course => {
    course.enrollments_raw?.forEach(e => {
      const date = new Date(e.enrolled_at).toISOString().split('T')[0];
      if (dailyActivity[date] !== undefined) {
        dailyActivity[date]++;
      }
    });
  });

  // Add submissions to activity
  const recentSubmissions = await AssignmentSubmission.findAll({
    where: {
      submitted_at: { [Op.gte]: new Date(new Date().setDate(new Date().getDate() - 7)) },
      content_id: {
        [Op.in]: sequelize.literal(`(SELECT content_id FROM lesson_contents WHERE section_id IN (SELECT section_id FROM course_sections WHERE course_id IN (${courses.map(c => c.course_id).join(',') || 0})))`)
      }
    }
  });

  recentSubmissions.forEach(s => {
    const date = new Date(s.submitted_at).toISOString().split('T')[0];
    if (dailyActivity[date] !== undefined) {
      dailyActivity[date]++;
    }
  });

  res.status(200).json({
    status: "success",
    data: {
      summary: {
        total_courses: courses.length,
        published_courses: courses.filter((c) => c.status === "published").length,
        total_students: totalStudents,
        total_revenue: totalRevenue.toFixed(2),
        overall_avg_rating: overallAvgRating,
        daily_activity: Object.values(dailyActivity)
      },
      courses: courseStats,
      recent_students: uniqueStudents,
      monthly_enrollments: monthlyData,
      pending_assignments: pendingAssignments.map(a => ({
        id: a.submission_id,
        student_name: a.student?.name,
        student_picture: a.student?.picture,
        lesson_title: a.lessonContent?.title,
        submitted_at: a.submitted_at
      }))
    },
  });
});

export const getCourseDetails = catchAsync(async (req, res, next) => {
  const course = await Course.findOne({
    where: {
      course_id: req.params.id,
      instructor_id: req.user.user_id,
    },
    include: [
      {
        model: CourseSection,
        as: "sections",
        include: [
          {
            model: LessonContent,
            as: "lessons",
            attributes: [
              "content_id",
              "parent_content_id",
              "title",
              "content_type",
              "duration",
              "is_free_preview",
              "position_order",
              "video_url",
              "file_url",
            ],
          },
        ],
        order: [["order_index", "ASC"]],
      },
      {
        model: Enrollment,
        as: "enrollments",
        attributes: ["enrollment_id", "student_id", "course_id", "status", "enrolled_at"],
        include: [
          {
            model: User,
            as: "student",
            attributes: ["user_id", "name", "picture", "email"],
          },
        ],
      },
      {
        model: Review,
        as: "reviews",
        attributes: ["rating"],
      },
    ],
  });

  if (!course) {
    return next(new AppError("Course not found.", 404));
  }

  res.status(200).json({
    status: "success",
    data: { course },
  });
});

export const getMyStudents = catchAsync(async (req, res) => {
  const instructorId = req.user.user_id;
  
  const courses = await Course.findAll({
    where: { instructor_id: instructorId },
    attributes: ["course_id"]
  });

  const enrollments = await Enrollment.findAll({
    where: {
      course_id: { [Op.in]: courses.map(c => c.course_id).length > 0 ? courses.map(c => c.course_id) : [0] }
    },
    include: [{
      model: User,
      as: "student",
      attributes: ["user_id", "name", "picture", "email", "role"]
    }]
  });

  const uniqueStudents = Array.from(
    new Map(
      enrollments
        .filter(e => e.student)
        .map(e => [e.student.user_id, e.student])
    ).values()
  );

  res.status(200).json({
    status: "success",
    data: uniqueStudents
  });
});
