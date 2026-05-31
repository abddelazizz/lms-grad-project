import express from "express";
import authenticate from "../middlewares/authMiddleware.js";
import restrictTo from "../middlewares/restrictTo.js";
import validate from "../middlewares/validationMiddleware.js";
import { sendMessageSchema } from "../validations/assistantValidation.js";
import { sendMessage, clearHistory } from "../handlers/assistantHandler.js";

const router = express.Router();

// All assistant routes require authentication + student or instructor role
router.use(authenticate);
router.use(restrictTo("student", "instructor"));

// POST /api/assistant/messages — send a message to the AI assistant
router.post("/messages", validate(sendMessageSchema), sendMessage);

// DELETE /api/assistant/history — clear conversation memory
router.delete("/history", clearHistory);

export default router;
