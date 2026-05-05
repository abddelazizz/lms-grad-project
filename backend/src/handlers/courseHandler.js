import * as courseService from "../services/courseService.js";
import AppError from "../utils/AppError.js";
import catchAsync from "../utils/catchAsync.js";

// POST /api/courses — instructor creates a new draft course
export const createCourse = catchAsync(async (req, res) => {
  const { title, category_id } = req.body;

  const course = await courseService.createCourse(
    { title, category_id },
    req.user.user_id
  );

  res.status(201).json({ status: "success", data: { course } });
});

// GET /api/courses — paginated list of published courses
export const getAllCourses = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 10, 50);

  const { courses, count } = await courseService.getAllPublishedCourses(page, limit);

  res.status(200).json({
    status: "success",
    page,
    limit,
    total: count,
    totalPages: Math.ceil(count / limit),
    data: { courses },
  });
});

// GET /api/courses/my-courses — list own courses (enrolled if student, created if instructor)
export const getMyCourses = catchAsync(async (req, res) => {
  const { user_id, role } = req.user;
  let courses;

  if (role === "student") {
    courses = await courseService.getEnrolledCourses(user_id);
  } else if (role === "instructor") {
    courses = await courseService.getCoursesByInstructor(user_id);
  } else {
    courses = [];
  }

  res.status(200).json({ status: "success", results: courses.length, data: { courses } });
});

// PATCH /api/courses/:id — update course metadata (description, level, price, etc.)
export const updateCourse = catchAsync(async (req, res) => {
  const { title, description, price, level, category_id, status } = req.body;

  const course = await courseService.updateCourse(
    req.params.id,
    req.user.user_id,
    req.user.role,
    { title, description, price, level, category_id, status }
  );

  res.status(200).json({ status: "success", data: { course } });
});

// PATCH /api/courses/:id/publish — publish a course (ownership enforced)
export const publishCourse = catchAsync(async (req, res) => {
  const course = await courseService.publishCourse(req.params.id, req.user.user_id, req.user.role);
  res.status(200).json({ status: "success", message: "Course published successfully", data: { course } });
});

// DELETE /api/courses/:id — soft-delete a course (ownership enforced)
export const deleteCourse = catchAsync(async (req, res) => {
  await courseService.softDeleteCourse(req.params.id, req.user.user_id, req.user.role);
  res.status(204).json({ status: "success", data: null });
});

// GET /api/courses/:id/details — public/student access to course lessons
export const getCourseDetails = catchAsync(async (req, res) => {
  const course = await courseService.getCourseDetails(req.params.id, req.user?.user_id, req.user?.role);
  res.status(200).json({ status: "success", data: { course } });
});
