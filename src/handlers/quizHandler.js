import catchAsync from "../utilis/catchAsync.js";
import AppError from "../utilis/AppError.js";
import { Quiz, QuizAttempt } from "../models/index.js";

// GET /api/quizzes/:id
export const getQuiz = catchAsync(async (req, res) => {
  const quiz = await Quiz.findByPk(req.params.id);
  
  if (!quiz) {
    throw new AppError("Quiz not found", 404);
  }

  res.status(200).json({
    status: "success",
    data: { quiz },
  });
});

// POST /api/quizzes/:id/submit
export const submitQuizAttempt = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { answers } = req.body; // Expecting an object: { "q_id_1": "answer", "q_id_2": "answer" }

  const quiz = await Quiz.findByPk(id);
  if (!quiz) {
    throw new AppError("Quiz not found", 404);
  }

  let score = 0;
  const questions = typeof quiz.questions_json === 'string' 
    ? JSON.parse(quiz.questions_json) 
    : quiz.questions_json;

  // Auto-grading logic: compare submitted answers with the correct option in questions_json
  if (questions && Array.isArray(questions)) {
    questions.forEach((q, index) => {
      // Allow flexible keying (e.g. question ID or index)
      const studentAnswer = answers[q.id] || answers[index];
      if (studentAnswer && studentAnswer === q.correctAnswer) {
        score += 1; // Assuming 1 point per question
      }
    });
  }

  // Record the attempt securely under the student's ID
  const attempt = await QuizAttempt.create({
    quiz_id: id,
    student_id: req.user.user_id,
    answers_json: answers,
    score,
  });

  res.status(200).json({
    status: "success",
    message: "Quiz submitted successfully",
    data: { score, attempt },
  });
});
