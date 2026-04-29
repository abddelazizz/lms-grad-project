import express from "express";
import { authenticate, restrictTo, validate } from "../middlewares/index.js";
import { createSection } from "../handlers/sectionHandler.js";
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

export default router;
