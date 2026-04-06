import express from "express";
import { authenticate, restrictTo, validate } from "../middlewares/index.js";
import {
  createCourse,
  getAllCourses,
  getMyCourses,
  updateCourse,
  deleteCourse,
  publishCourse,
} from "../handlers/index.js";
import { createCourseSchema, updateCourseSchema } from "../validations/index.js";

const router = express.Router();

// ─── Public (authenticated) ───────────────────────────────────
// GET /api/courses — paginated list of published courses
router.get("/", authenticate, getAllCourses);

// ─── Student ──────────────────────────────────────────────────
// GET /api/courses/my-courses — list enrolled courses (placeholder)
router.get("/my-courses", authenticate, restrictTo("student"), getMyCourses);

// ─── Instructor / Admin ───────────────────────────────────────
// POST /api/courses — create course (validates body via Joi)
router.post(
  "/",
  authenticate,
  restrictTo("instructor", "admin"),
  validate(createCourseSchema),
  createCourse
);

// PATCH /api/courses/:id — update allowed fields only
router.patch(
  "/:id",
  authenticate,
  restrictTo("instructor", "admin"),
  validate(updateCourseSchema),
  updateCourse
);

// PATCH /api/courses/:id/publish — publish with business logic gate
router.patch(
  "/:id/publish",
  authenticate,
  restrictTo("instructor", "admin"),
  publishCourse
);

// DELETE /api/courses/:id — soft-delete (paranoid)
router.delete(
  "/:id",
  authenticate,
  restrictTo("instructor", "admin"),
  deleteCourse
);

export default router;
