import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/AppError.js";
import { quizService } from "../services/index.js";

export const generateQuiz = catchAsync(async (req, res) => {
  const buffer = req.file?.buffer;
  if (!buffer) {
    throw new AppError("Please upload a PDF file.", 400);
  }

  const quiz = await quizService.generateQuiz({
    ...req.body,
    buffer,
  });

  res.status(200).json({
    status: "success",
    data: { quiz },
  });
});

export const saveQuiz = catchAsync(async (req, res) => {
  const quiz = await quizService.saveQuiz(req.body, req.user.user_id);

  res.status(201).json({
    status: "success",
    data: { quiz },
  });
});

export const publishQuiz = catchAsync(async (req, res) => {
  const quiz = await quizService.publishQuiz(
    req.params.id,
    req.user.user_id,
    req.user.role
  );

  res.status(200).json({
    status: "success",
    message: "Quiz published successfully",
    data: { quiz },
  });
});

export const getQuiz = catchAsync(async (req, res) => {
  const quiz = await quizService.getQuizForStudent(
    req.params.id,
    req.user.user_id
  );

  res.status(200).json({
    status: "success",
    data: { quiz },
  });
});

export const submitQuizAttempt = catchAsync(async (req, res) => {
  const { answers, time_taken_seconds } = req.body;
  const { score, total_quiz_score, attempt_id } =
    await quizService.submitQuizAttempt(
      req.params.id,
      req.user.user_id,
      answers,
      time_taken_seconds || null
    );

  res.status(200).json({
    status: "success",
    message: "Quiz submitted successfully",
    data: { score, total_quiz_score, attempt_id },
  });
});

export const reviewQuiz = catchAsync(async (req, res) => {
  const review = await quizService.reviewQuiz(
    req.params.id,
    req.user.user_id
  );

  res.status(200).json({
    status: "success",
    data: review,
  });
});
