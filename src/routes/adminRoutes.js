import express from "express";
import { authenticate, restrictTo, validate } from "../middlewares/index.js";
import { createInstructor } from "../handlers/index.js";
import { createInstructorSchema } from "../validations/index.js";

const router = express.Router();

// POST /api/admin/create-instructor
// Validated + restricted to admin role only
router.post(
  "/create-instructor",
  authenticate,
  restrictTo("admin"),
  validate(createInstructorSchema),
  createInstructor
);

export default router;
