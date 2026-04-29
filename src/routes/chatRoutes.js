import express from "express";
import { getHistory, getContacts } from "../handlers/chatHandler.js";
import authenticate from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(authenticate);

// GET /api/chat/contacts - Get list of users I've chatted with
router.get("/contacts", getContacts);

// GET /api/chat/history/:otherUserId - Get messages between me and someone else
router.get("/history/:otherUserId", getHistory);

export default router;
