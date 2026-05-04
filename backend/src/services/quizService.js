import { GoogleGenerativeAI } from "@google/generative-ai";
import { v2 as cloudinary } from "cloudinary";
import { Quiz, QuizAttempt, CourseSection, Student } from "../models/index.js";
import AppError from "../utils/AppError.js";

const MAX_TEXT_LENGTH = 30000;

const pdfParse = async (buffer) => {
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  await parser.destroy();
  return result;
};

export const extractTextFromBuffer = async (buffer) => {
  const data = await pdfParse(buffer);

  if (!data.text || data.text.trim().length === 0) {
    throw new AppError(
      "Could not extract text from the PDF. Please ensure it contains selectable text.",
      400
    );
  }

  return data.text.slice(0, MAX_TEXT_LENGTH);
};

export const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "recode_academy_quiz_materials",
        resource_type: "raw",
      },
      (error, result) => {
        if (error) {
          return reject(new AppError("Failed to upload PDF to storage.", 502));
        }
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
};

export const buildQuizPrompt = (text, numQuestions) => {
  return `You are an educational quiz generator. Based on the following course material, generate exactly ${numQuestions} multiple-choice questions.

RULES:
- Each question must have exactly 4 options
- Only ONE option is correct
- Test understanding, not memorization
- Mix difficulty levels: ~30% easy, ~40% medium, ~30% hard
- The correctAnswer must be the exact text of one of the options
- Each question ID must be unique (q1, q2, q3, ...)

Return your response as a JSON array with this exact structure:
[
  {
    "id": "q1",
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Option B",
    "difficulty": "easy"
  }
]

COURSE MATERIAL:
${text}`;
};

export const callGemini = async (prompt) => {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: { responseMimeType: "application/json" },
  });

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();

  let questions;
  try {
    questions = JSON.parse(responseText);
  } catch {
    throw new AppError(
      "AI failed to generate valid questions. Please try again.",
      502
    );
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    throw new AppError(
      "AI failed to generate valid questions. Please try again.",
      502
    );
  }

  questions.forEach((q, i) => {
    if (!q.id || !q.question || !Array.isArray(q.options) || q.options.length !== 4 || !q.correctAnswer) {
      throw new AppError(
        `AI generated an invalid question at index ${i}. Please try again.`,
        502
      );
    }
  });

  return questions;
};

export const generateQuiz = async ({ title, section_id, num_questions, score_per_question, duration, buffer }) => {
  const text = await extractTextFromBuffer(buffer);
  const material_url = await uploadToCloudinary(buffer);
  const prompt = buildQuizPrompt(text, num_questions);
  const questions = await callGemini(prompt);

  return {
    title,
    section_id,
    duration,
    num_questions,
    score_per_question,
    total_score: num_questions * score_per_question,
    material_url,
    questions,
  };
};

export const saveQuiz = async (quizData, instructorId) => {
  const section = await CourseSection.findByPk(quizData.section_id);
  if (!section) {
    throw new AppError("Course section not found.", 404);
  }

  const quiz = await Quiz.create({
    title: quizData.title,
    section_id: quizData.section_id,
    created_by: instructorId,
    duration: quizData.duration,
    num_questions: quizData.questions.length,
    score_per_question: quizData.score_per_question,
    total_score: quizData.questions.length * quizData.score_per_question,
    material_url: quizData.material_url || null,
    questions_json: quizData.questions,
    status: "draft",
  });

  return quiz;
};

export const publishQuiz = async (quizId, instructorId, role) => {
  const quiz = await Quiz.findByPk(quizId);
  if (!quiz) {
    throw new AppError("Quiz not found.", 404);
  }

  if (quiz.created_by !== instructorId && role !== "admin") {
    throw new AppError("You do not have permission to perform this action.", 403);
  }

  if (quiz.status === "published") {
    throw new AppError("Quiz is already published.", 400);
  }

  await quiz.update({ status: "published" });
  return quiz;
};

export const getQuizForStudent = async (quizId, studentId) => {
  const quiz = await Quiz.findByPk(quizId);
  if (!quiz) {
    throw new AppError("Quiz not found.", 404);
  }

  if (quiz.status !== "published") {
    throw new AppError("Quiz not found.", 404);
  }

  const questions = typeof quiz.questions_json === "string"
    ? JSON.parse(quiz.questions_json)
    : quiz.questions_json;

  const safeQuestions = questions.map(({ correctAnswer, difficulty, ...rest }) => rest);

  const existingAttempt = await QuizAttempt.findOne({
    where: { quiz_id: quizId, student_id: studentId },
  });

  return {
    quiz_id: quiz.quiz_id,
    title: quiz.title,
    duration: quiz.duration,
    num_questions: quiz.num_questions,
    score_per_question: quiz.score_per_question,
    total_score: quiz.total_score,
    status: quiz.status,
    attempted: !!existingAttempt,
    questions: safeQuestions,
  };
};

export const submitQuizAttempt = async (quizId, studentId, answers) => {
  const quiz = await Quiz.findByPk(quizId);
  if (!quiz) {
    throw new AppError("Quiz not found.", 404);
  }

  if (quiz.status !== "published") {
    throw new AppError("Quiz not found.", 404);
  }

  const existingAttempt = await QuizAttempt.findOne({
    where: { quiz_id: quizId, student_id: studentId },
  });
  if (existingAttempt) {
    throw new AppError("You have already attempted this quiz.", 403);
  }

  const questions = typeof quiz.questions_json === "string"
    ? JSON.parse(quiz.questions_json)
    : quiz.questions_json;

  let score = 0;
  if (questions && Array.isArray(questions)) {
    questions.forEach((q) => {
      const studentAnswer = answers[q.id];
      if (studentAnswer && studentAnswer === q.correctAnswer) {
        score += quiz.score_per_question;
      }
    });
  }

  const attempt = await QuizAttempt.create({
    quiz_id: quizId,
    student_id: studentId,
    answers_json: answers,
    score,
    total_quiz_score: quiz.total_score,
  });

  await Student.increment("total_points", {
    by: score,
    where: { user_id: studentId },
  });

  return {
    score,
    total_quiz_score: quiz.total_score,
    attempt_id: attempt.attempt_id,
  };
};

export const reviewQuiz = async (quizId, studentId) => {
  const attempt = await QuizAttempt.findOne({
    where: { quiz_id: quizId, student_id: studentId },
  });
  if (!attempt) {
    throw new AppError("You must attempt the quiz first.", 403);
  }

  const quiz = await Quiz.findByPk(quizId);
  if (!quiz) {
    throw new AppError("Quiz not found.", 404);
  }

  const questions = typeof quiz.questions_json === "string"
    ? JSON.parse(quiz.questions_json)
    : quiz.questions_json;

  const studentAnswers = typeof attempt.answers_json === "string"
    ? JSON.parse(attempt.answers_json)
    : attempt.answers_json;

  const review = questions.map((q) => {
    const studentAnswer = studentAnswers[q.id] || null;
    return {
      id: q.id,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      difficulty: q.difficulty,
      studentAnswer,
      isCorrect: studentAnswer === q.correctAnswer,
    };
  });

  return {
    quiz: {
      title: quiz.title,
      total_score: quiz.total_score,
    },
    review,
    score: attempt.score,
    total_quiz_score: attempt.total_quiz_score,
  };
};
