import Joi from "joi";

export const createConversationSchema = Joi.object({
  otherUserId: Joi.number().integer().positive().required(),
});

export const sendMessageSchema = Joi.object({
  conversationId: Joi.number().integer().positive().required(),
  content: Joi.string().trim().min(1).max(2000).required(),
});

export const markReadSchema = Joi.object({
  conversationId: Joi.number().integer().positive().required(),
});

export const paginationQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(50),
});
