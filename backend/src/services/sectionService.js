import Course from "../models/Course.js";
import CourseSection from "../models/CourseSection.js";
import AppError from "../utils/AppError.js";

/**
 * Verify the instructor owns the course (or is admin).
 * Returns the course if authorized.
 */
const verifyCourseOwnership = async (courseId, instructorId, role) => {
  const course = await Course.findByPk(courseId);
  if (!course) {
    throw new AppError("Course not found", 404);
  }
  if (role !== "admin" && course.instructor_id !== instructorId) {
    throw new AppError("You are not allowed to modify this course", 403);
  }
  return course;
};

/**
 * Verify the section exists and the instructor owns the parent course.
 * Returns the section if authorized.
 */
const verifySectionOwnership = async (sectionId, instructorId, role) => {
  const section = await CourseSection.findByPk(sectionId);
  if (!section) {
    throw new AppError("Section not found", 404);
  }
  await verifyCourseOwnership(section.course_id, instructorId, role);
  return section;
};

/**
 * POST /api/courses/:courseId/sections
 * Creates a CourseSection and auto-calculates order_index.
 */
export const createSection = async (courseId, instructorId, role, title) => {
  await verifyCourseOwnership(courseId, instructorId, role);

  // Auto-calculate order_index by counting existing sections
  const existingCount = await CourseSection.count({ where: { course_id: courseId } });

  const section = await CourseSection.create({
    course_id: courseId,
    title,
    order_index: existingCount + 1,
  });

  return section;
};

export { verifyCourseOwnership, verifySectionOwnership };
