import Joi from "joi";

// ─── Section Schemas ─────────────────────────────────────────
export const createSectionSchema = Joi.object({
  title: Joi.string().min(2).max(200).required(),
});

export const createLessonSchema = Joi.object({
  title: Joi.string().min(2).max(255).required(),
  content_type: Joi.string().valid("video", "pdf_lecture", "pdf_assignment").required(),
  is_free_preview: Joi.boolean().truthy("true").falsy("false").default(false),
  parent_content_id: Joi.number().integer().positive().optional().allow(null).empty(""),
});

// ─── Progress Schema ─────────────────────────────────────────
export const updateProgressSchema = Joi.object({
  last_watched_at: Joi.number().integer().min(0).required(),
  status: Joi.string().valid("in_progress", "completed").required(),
});
