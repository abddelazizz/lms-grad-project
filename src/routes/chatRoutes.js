import express from "express";
import {
  createConversation,
  getConversations,
  getMessages,
  markAsRead,
} from "../handlers/chatHandler.js";
import authenticate from "../middlewares/authMiddleware.js";
import restrictTo from "../middlewares/restrictTo.js";
import validate from "../middlewares/validationMiddleware.js";
import { createConversationSchema } from "../validations/chatValidation.js";

const router = express.Router();

router.use(authenticate);

router.use(restrictTo("student", "instructor"));

router.post("/conversations", validate(createConversationSchema), createConversation);

router.get("/conversations", getConversations);

router.get("/conversations/:id/messages", getMessages);

router.patch("/conversations/:id/read", markAsRead);

export default router;