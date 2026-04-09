import express from "express";
import { authenticate, restrictTo } from "../middlewares/index.js";
import { getDashboardStats, getCourseDetails } from "../handlers/index.js";

const router = express.Router();

// All instructor routes require authentication and the instructor (or admin) role
router.use(authenticate, restrictTo("instructor", "admin"));

// GET /api/instructor/dashboard-stats
router.get("/dashboard-stats", getDashboardStats);

// GET /api/instructor/courses/:id/details
router.get("/courses/:id/details", getCourseDetails);

export default router;
