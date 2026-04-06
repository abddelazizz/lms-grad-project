import Course from "../models/Course.js";
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
