import express from "express";
import {
  generateQuiz,
  saveQuiz,
  publishQuiz,
  getQuiz,
  submitQuizAttempt,
  reviewQuiz,
} from "../handlers/quizHandler.js";
import authenticate from "../middlewares/authMiddleware.js";
import restrictTo from "../middlewares/restrictTo.js";
import { uploadQuizMaterial } from "../middlewares/uploadMiddleware.js";
import validate from "../middlewares/validationMiddleware.js";
import { generateQuizSchema, saveQuizSchema } from "../validations/quizValidation.js";

const router = express.Router();

router.post(
  "/generate",
  authenticate,
  restrictTo("instructor", "admin"),
  uploadQuizMaterial,
  validate(generateQuizSchema),
  generateQuiz
);

router.post(
  "/save",
  authenticate,
  restrictTo("instructor", "admin"),
  validate(saveQuizSchema),
  saveQuiz
);

router.post(
  "/:id/publish",
  authenticate,
  restrictTo("instructor", "admin"),
  publishQuiz
);

router.get("/:id", authenticate, getQuiz);

router.post("/:id/submit", authenticate, submitQuizAttempt);

router.get("/:id/review", authenticate, reviewQuiz);

export default router;
