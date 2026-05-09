import express from "express";
import { authenticate, restrictTo, validate } from "../middlewares/index.js";
import { createSection, deleteSection } from "../handlers/sectionHandler.js";
import { createSectionSchema } from "../validations/courseValidation.js";

const router = express.Router();

// POST /api/courses/:courseId/sections — create a section (instructor/admin)
router.post(
  "/courses/:courseId/sections",
  authenticate,
  restrictTo("instructor", "admin"),
  validate(createSectionSchema),
  createSection
);

// DELETE /api/courses/:courseId/sections/:sectionId — delete a section
router.delete(
  "/courses/:courseId/sections/:sectionId",
  authenticate,
  restrictTo("instructor", "admin"),
  deleteSection
);

export default router;
