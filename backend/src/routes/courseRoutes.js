import express from "express";
import { authenticate, optionalAuthenticate, restrictTo, validate } from "../middlewares/index.js";
import {
  createCourse,
  getAllCourses,
  getMyCourses,
  updateCourse,
  deleteCourse,
  publishCourse,
  getCourseDetails
} from "../handlers/index.js";
import { createCourseSchema, updateCourseSchema } from "../validations/index.js";

const router = express.Router();

// GET /api/courses — paginated list of published courses
router.get("/", getAllCourses);

// ─── Student ──────────────────────────────────────────────────
// GET /api/courses/my-courses — list enrolled courses (student) or created courses (instructor)
router.get("/my-courses", authenticate, restrictTo("student", "instructor"), getMyCourses);

// GET /api/courses/:id/details or /api/courses/:id — get sections and lessons
router.get("/:id/details", optionalAuthenticate, getCourseDetails);
router.get("/:id", optionalAuthenticate, getCourseDetails);

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
