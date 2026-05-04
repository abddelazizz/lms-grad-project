import express from "express";
import { authenticate, restrictTo, validate } from "../middlewares/index.js";
import { enrollStudent, watchLesson, updateProgress } from "../handlers/enrollmentHandler.js";
import { updateProgressSchema } from "../validations/courseValidation.js";

const router = express.Router();

// POST /api/courses/:courseId/enroll — enroll student in a course
router.post(
  "/courses/:courseId/enroll",
  authenticate,
  restrictTo("student"),
  enrollStudent
);

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
  restrictTo("student"),
  validate(updateProgressSchema),
  updateProgress
);

export default router;
