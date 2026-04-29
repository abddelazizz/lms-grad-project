import express from "express";
import { markAsRead, getUnreadCount } from "../handlers/notificationHandler.js";
import authenticate from "../middlewares/authMiddleware.js";

const router = express.Router();

// All notification routes require authentication (any role)
router.use(authenticate);

// GET /api/notifications/unread-count
router.get("/unread-count", getUnreadCount);

// PATCH /api/notifications/:notificationId/read
router.patch("/:notificationId/read", markAsRead);

export default router;
