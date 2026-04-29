import express from "express";
import { authenticate, restrictTo } from "../middlewares/index.js";
import { validate } from "../middlewares/index.js";
import { uploadThumbnail, createUnifiedLesson, deleteLesson } from "../handlers/lessonHandler.js";
import { uploadCourseThumbnail } from "../middlewares/uploadMiddleware.js";
import { uploadLessonMaterial } from "../middlewares/uploadMiddleware.js";
import { createLessonSchema } from "../validations/index.js";

const router = express.Router();

// PATCH /api/courses/:courseId/thumbnail — upload thumbnail (instructor/admin)
router.patch(
  "/courses/:courseId/thumbnail",
  authenticate,
  restrictTo("instructor", "admin"),
  uploadCourseThumbnail,
  uploadThumbnail
);

// POST /api/sections/:sectionId/lessons — unified lesson upload (instructor/admin)
// Accepts multipart/form-data with fields: lesson_file, title, content_type, is_free_preview
router.post(
  "/sections/:sectionId/lessons",
  authenticate,
  restrictTo("instructor", "admin"),
  uploadLessonMaterial,
  validate(createLessonSchema),
  createUnifiedLesson
);

// DELETE /api/lessons/:lessonId — soft-delete a lesson (instructor/admin)
router.delete(
  "/lessons/:lessonId",
  authenticate,
  restrictTo("instructor", "admin"),
  deleteLesson
);

export default router;
