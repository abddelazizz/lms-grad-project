import Joi from "joi";

export const generateQuizSchema = Joi.object({
  title: Joi.string().min(2).max(200).required(),
  section_id: Joi.number().integer().positive().required(),
  num_questions: Joi.number().valid(5, 10, 15, 20).required(),
  score_per_question: Joi.number().integer().min(1).required(),
  duration: Joi.number().integer().min(1).required(),
});

export const saveQuizSchema = Joi.object({
  title: Joi.string().min(2).max(200).required(),
  section_id: Joi.number().integer().positive().required(),
  duration: Joi.number().integer().min(1).required(),
  num_questions: Joi.number().integer().min(1).required(),
  score_per_question: Joi.number().integer().min(1).required(),
  material_url: Joi.string().uri().allow("", null),
  questions: Joi.array().min(1).items(
    Joi.object({
      id: Joi.string().required(),
      question: Joi.string().required(),
      options: Joi.array().length(4).items(Joi.string().required()).required(),
      correctAnswer: Joi.string().required(),
      difficulty: Joi.string().valid("easy", "medium", "hard"),
    })
  ).required(),
});