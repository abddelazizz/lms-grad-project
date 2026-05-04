import Joi from "joi";

const passwordSchema = Joi.string()
  .min(8)
  .max(72)
  .pattern(/[A-Z]/, "uppercase")
  .pattern(/[a-z]/, "lowercase")
  .pattern(/[0-9]/, "number")
  .required()
  .messages({
    "string.min": "Password must be at least 8 characters",
    "string.pattern.name": "Password must include at least one {#name} letter",
  });

// POST /api/admin/instructors
export const createInstructorSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: passwordSchema,
  bio: Joi.string().max(500).optional().allow("", null),
  specialization: Joi.string().max(100).optional().allow("", null),
});

// POST /api/admin/students
export const createStudentSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: passwordSchema,
  gradeLevel: Joi.string().max(50).optional().allow("", null),
  parentId: Joi.number().integer().optional().allow(null),
});

// GET query pagination/search validation
export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().max(100).optional().allow(""),
});
