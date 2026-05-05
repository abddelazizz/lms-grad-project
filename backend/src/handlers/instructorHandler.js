import { Course, Enrollment, Review, CourseSection, LessonContent } from "../models/index.js";
import { sequelize } from "../config/index.js";
import { Op } from "sequelize";
import { catchAsync, AppError } from "../utils/index.js";

export const getDashboardStats = catchAsync(async (req, res) => {
  const instructorId = req.user.user_id;

  const courses = await Course.findAll({
    where: { instructor_id: instructorId },
    attributes: ["course_id", "title", "status", "price", "thumbnail_url"],
    include: [
      {
        model: Enrollment,
        as: "enrollments",
        attributes: ["status", "progress_percentage"],
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

  const courseStats = courses.map((course) => {
    const activeEnrollments = course.enrollments.filter(
      (e) => e.status === "active"
    ).length;
    const completedEnrollments = course.enrollments.filter(
      (e) => e.status === "completed"
    ).length;
    const revenue =
      parseFloat(course.price) * course.enrollments.length;

    const avgRating =
      course.reviews.length > 0
        ? (
            course.reviews.reduce((sum, r) => sum + r.rating, 0) /
            course.reviews.length
          ).toFixed(1)
        : null;

    totalStudents += course.enrollments.length;
    totalRevenue += revenue;
    course.reviews.forEach((r) => {
      totalRatings += r.rating;
      ratingsCount++;
    });

    // Count sections and lessons
    const total_sections = course.sections ? course.sections.length : 0;
    const total_lessons = course.sections
      ? course.sections.reduce((sum, s) => sum + (s.lessons ? s.lessons.length : 0), 0)
      : 0;

    return {
      course_id: course.course_id,
      title: course.title,
      status: course.status,
      thumbnail_url: course.thumbnail_url || null,
      total_sections,
      total_lessons,
      enrollments: {
        total: course.enrollments.length,
        active: activeEnrollments,
        completed: completedEnrollments,
      },
      revenue,
      avg_rating: avgRating,
      total_reviews: course.reviews.length,
    };
  });

  const overallAvgRating =
    ratingsCount > 0 ? (totalRatings / ratingsCount).toFixed(1) : null;

  res.status(200).json({
    status: "success",
    data: {
      summary: {
        total_courses: courses.length,
        published_courses: courses.filter((c) => c.status === "published")
          .length,
        total_students: totalStudents,
        total_revenue: totalRevenue.toFixed(2),
        overall_avg_rating: overallAvgRating,
      },
      courses: courseStats,
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
        attributes: ["status"],
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
