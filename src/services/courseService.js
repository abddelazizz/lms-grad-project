import Course from "../models/Course.js";
import CourseSection from "../models/CourseSection.js";
import LessonContent from "../models/LessonContent.js";
import AppError from "../utilis/AppError.js";

export const createCourse = async (courseData, instructorId) => {
  const course = await Course.create({
    ...courseData,
    instructor_id: instructorId,
    status: "draft",
  });
  return course;
};

export const getAllPublishedCourses = async (page, limit) => {
  const offset = (page - 1) * limit;

  const { count, rows: courses } = await Course.findAndCountAll({
    where: { status: "published" },
    limit,
    offset,
    order: [["created_at", "DESC"]],
  });

  return { courses, count };
};

export const getCoursesByInstructor = async (instructorId) => {
  const courses = await Course.findAll({
    where: { instructor_id: instructorId },
    order: [["created_at", "DESC"]],
  });
  return courses;
};

export const updateCourse = async (courseId, instructorId, role, updateData) => {
  const course = await Course.findByPk(courseId);

  if (!course) {
    throw new AppError("Course not found", 404);
  }

  if (role !== "admin" && course.instructor_id !== instructorId) {
    throw new AppError("You are not allowed to modify this course", 403);
  }

  await course.update(updateData);
  return course;
};

export const publishCourse = async (courseId, instructorId, role) => {
  const course = await Course.findByPk(courseId, {
    include: [{ association: "sections", include: [{ association: "lessons" }] }],
  });

  if (!course) {
    throw new AppError("Course not found", 404);
  }

  if (role !== "admin" && course.instructor_id !== instructorId) {
    throw new AppError("You are not allowed to publish this course", 403);
  }

  if (!course.sections || course.sections.length === 0) {
    throw new AppError("A course must have at least one section before publishing", 422);
  }

  const hasLesson = course.sections.some((s) => s.lessons && s.lessons.length > 0);
  if (!hasLesson) {
    throw new AppError("Each section must have at least one lesson before publishing", 422);
  }

  await course.update({ status: "published" });
  return course;
};

export const softDeleteCourse = async (courseId, instructorId, role) => {
  const course = await Course.findByPk(courseId);

  if (!course) {
    throw new AppError("Course not found", 404);
  }

  if (role !== "admin" && course.instructor_id !== instructorId) {
    throw new AppError("You are not allowed to delete this course", 403);
  }

  await course.destroy();
};

export const getCourseDetails = async (courseId, userId = null, role = null) => {
  const course = await Course.findByPk(courseId, {
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
              "title",
              "content_type",
              "duration",
              "is_free_preview",
              "position_order",
            ],
          },
        ],
        order: [
          [{ model: CourseSection, as: "sections" }, "order_index", "ASC"],
        ],
      },
    ],
  });

  if (!course) {
    throw new AppError("Course not found", 404);
  }

  // Enrollment check
  let isEnrolled = false;
  if (userId) {
    // Admin and the instructor of the course are always "enrolled"
    if (role === "admin" || course.instructor_id === userId) {
      isEnrolled = true;
    } else {
      const enrollment = await Enrollment.findOne({
        where: { student_id: userId, course_id: courseId },
      });
      isEnrolled = !!enrollment;
    }
  }

  // Convert to JSON and add extra fields
  const courseData = course.toJSON();
  courseData.isEnrolled = isEnrolled;

  return courseData;
};
