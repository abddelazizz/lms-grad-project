import express from "express";
import { authenticate, restrictTo, validate } from "../middlewares/index.js";
import { authLimiter } from "../middlewares/rateLimiter.js";
import {
  createInstructor,
  getAllInstructors,
  getInstructorById,
  removeInstructor,
  createStudent,
  getAllStudents,
  getStudentById,
  removeStudent,
  getAdminDashboardStats,
} from "../handlers/adminHandler.js";
import {
  createInstructorSchema,
  createStudentSchema,
} from "../validations/adminValidators.js";

const router = express.Router();

// All admin routes: JWT → role check → admin rate limit
router.use(authenticate, restrictTo("admin"), authLimiter);

// ─── Instructor Management ────────────────────────────────────
router
  .route("/instructors")
  .post(validate(createInstructorSchema), createInstructor)
  .get(getAllInstructors);

router
  .route("/instructors/:id")
  .get(getInstructorById)
  .delete(removeInstructor);

// ─── Student Management ───────────────────────────────────────
router
  .route("/students")
  .post(validate(createStudentSchema), createStudent)
  .get(getAllStudents);

router
  .route("/students/:id")
  .get(getStudentById)
  .delete(removeStudent);

// ─── Dashboard ────────────────────────────────────────────────
router.get("/dashboard/stats", getAdminDashboardStats);

export default router;
