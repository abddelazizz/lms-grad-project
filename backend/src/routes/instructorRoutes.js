import express from "express";
import { authenticate, restrictTo } from "../middlewares/index.js";
import { getDashboardStats, instructorGetCourseDetails as getCourseDetails, getMyStudents } from "../handlers/index.js";
import { getInstructorInbox } from "../handlers/assignmentHandler.js";

const router = express.Router();

// All instructor routes require authentication and the instructor (or admin) role
router.use(authenticate, restrictTo("instructor", "admin"));

// GET /api/instructor/dashboard-stats
router.get("/dashboard-stats", getDashboardStats);

// GET /api/instructor/my-students
router.get("/my-students", getMyStudents);

// GET /api/instructor/courses/:id/details
router.get("/courses/:id/details", getCourseDetails);

// GET /api/instructor/inbox/assignments — the instructor inbox feed
router.get("/inbox/assignments", getInstructorInbox);

export default router;

