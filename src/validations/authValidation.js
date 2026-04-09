import Joi from "joi";

// ─── Auth Schemas ─────────────────────────────────────────────
const signupSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  username: Joi.string()
    .min(3)
    .max(30)
    .pattern(/^[a-zA-Z0-9._-]+$/)
    .optional()
    .messages({
      "string.pattern.base": "Username can only contain letters, numbers, dot (.), underscore (_), and dash (-).",
    }),
  email: Joi.string().email().required(),
  password: Joi.string()
    .min(8)
    .max(72) // bcrypt truncates at 72 bytes
    .pattern(/[A-Z]/, "uppercase letter")
    .pattern(/[0-9]/, "number")
    .pattern(/[^a-zA-Z0-9]/, "special character")
    .required()
    .messages({
      "string.min": "Password must be at least 8 characters",
      "string.pattern.name": "Password must include at least one {#name}",
    }),
  role: Joi.string()
    .valid("student", "instructor")
    .default("student"),
  picture: Joi.string().uri().optional(),
  // ✅ admin/parent cannot be self-registered — removed from valid list
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

const resetPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string().required(),
  newPassword: Joi.string()
    .min(8)
    .max(72)
    .pattern(/[A-Z]/, "uppercase letter")
    .pattern(/[0-9]/, "number")
    .pattern(/[^a-zA-Z0-9]/, "special character")
    .required(),
});

const resendVerificationSchema = Joi.object({
  email: Joi.string().email().required(),
});

// ─── Course Schemas ───────────────────────────────────────────
const createCourseSchema = Joi.object({
  title: Joi.string().min(5).max(150).required(),
  description: Joi.string().max(5000).optional(),
  price: Joi.number().min(0).precision(2).default(0),
  level: Joi.string().valid("beginner", "intermediate", "advanced").optional(),
  category_id: Joi.number().integer().optional(),
  thumbnail_url: Joi.string().uri().optional(),
});

const updateCourseSchema = Joi.object({
  title: Joi.string().min(5).max(150).optional(),
  description: Joi.string().max(5000).optional(),
  price: Joi.number().min(0).precision(2).optional(),
  level: Joi.string().valid("beginner", "intermediate", "advanced").optional(),
  category_id: Joi.number().integer().optional(),
  thumbnail_url: Joi.string().uri().optional(),
}).min(1); // must provide at least one field to update

// ─── Admin Schemas ────────────────────────────────────────────
const createInstructorSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(72).required(),
});

const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(50).optional(),
  username: Joi.string().min(3).max(30).pattern(/^[a-zA-Z0-9._-]+$/).optional(),
  phone_number: Joi.string().min(10).max(15).pattern(/^[0-9]+$/).optional(),
  grade_level: Joi.string().optional(),
});

export {
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  resendVerificationSchema,
  createCourseSchema,
  updateCourseSchema,
  createInstructorSchema,
  updateProfileSchema,
};
