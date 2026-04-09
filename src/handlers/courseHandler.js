import * as courseService from "../services/courseService.js";
import AppError from "../utilis/AppError.js";
import catchAsync from "../utilis/catchAsync.js";

// POST /api/courses — instructor creates a new course
export const createCourse = catchAsync(async (req, res) => {
  const { title, description, price, level, category_id, thumbnail_url } = req.body;

  if (!title) {
    throw new AppError("Title is required", 400);
  }

  const course = await courseService.createCourse({
    title, description, price, level, category_id, thumbnail_url
  }, req.user.user_id);

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

// GET /api/courses/my-courses — instructor's own courses
export const getMyCourses = catchAsync(async (req, res) => {
  const courses = await courseService.getCoursesByInstructor(req.user.user_id);
  res.status(200).json({ status: "success", results: courses.length, data: { courses } });
});

// PATCH /api/courses/:id — update a course (ownership enforced)
export const updateCourse = catchAsync(async (req, res) => {
  const { title, description, price, level, thumbnail_url, category_id } = req.body;

  if (price !== undefined && price < 0) {
    throw new AppError("Price cannot be negative", 400);
  }

  const course = await courseService.updateCourse(
    req.params.id, 
    req.user.user_id, 
    req.user.role, 
    { title, description, price, level, thumbnail_url, category_id }
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
