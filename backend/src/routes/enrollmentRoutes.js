import express from "express";
import { authenticate, restrictTo, validate } from "../middlewares/index.js";
import { enrollStudent, watchLesson, updateProgress, updateEnrollmentStatus } from "../handlers/enrollmentHandler.js";
import { updateProgressSchema } from "../validations/courseValidation.js";

const router = express.Router();

// ─── Enrollments ──────────────────────────────────────────────

// POST /api/courses/:courseId/enroll — enroll student in a course
router.post(
  "/courses/:courseId/enroll",
  authenticate,
  restrictTo("student"),
  enrollStudent
);

// PATCH /api/enrollments/:id — update enrollment (e.g. withdraw)
router.patch(
  "/enrollments/:id",
  authenticate,
  restrictTo("student"),
  updateEnrollmentStatus
);

// ─── Content & Progress ───────────────────────────────────────

// GET /api/lessons/:lessonId/watch — access lesson content
router.get(
  "/lessons/:lessonId/watch",
  authenticate,
  watchLesson
);

// PATCH /api/progress/lessons/:lessonId — update lesson progress
router.patch(
  "/progress/lessons/:lessonId",
  authenticate,
  validate(updateProgressSchema),
  updateProgress
);

export default router;
