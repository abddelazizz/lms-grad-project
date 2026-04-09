import express from "express";
import { getQuiz, submitQuizAttempt } from "../handlers/quizHandler.js";
import authenticate from "../middlewares/authMiddleware.js";

const router = express.Router();

// GET a quiz details
router.get("/:id", authenticate, getQuiz);

// POST a quiz submission for automatic grading
router.post("/:id/submit", authenticate, submitQuizAttempt);

export default router;
