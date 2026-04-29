import { Course, Enrollment, Review, CourseSection, LessonContent } from "../models/index.js";
import { sequelize } from "../config/index.js";
import { Op } from "sequelize";

// GET /api/instructor/dashboard-stats
export const getDashboardStats = async (req, res, next) => {
  try {
    const instructorId = req.user.user_id;

    // All courses owned by this instructor
    const courses = await Course.findAll({
      where: { instructor_id: instructorId },
      attributes: ["course_id", "title", "status", "price"],
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
      ],
    });

    // Aggregate stats
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

      return {
        course_id: course.course_id,
        title: course.title,
        status: course.status,
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
  } catch (error) {
    next(error);
  }
};

// GET /api/instructor/courses/:id/details
// Full breakdown: sections → lessons with counts
export const getCourseDetails = async (req, res, next) => {
  try {
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
      return res
        .status(404)
        .json({ status: "fail", message: "Course not found" });
    }

    res.status(200).json({
      status: "success",
      data: { course },
    });
  } catch (error) {
    next(error);
  }
};
