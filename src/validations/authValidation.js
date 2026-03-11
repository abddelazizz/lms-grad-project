import Joi from "joi";

const signupSchema = Joi.object({
  name: Joi.string().alphanum().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string()
    .pattern(new RegExp("^[a-zA-Z0-9]{3,30}$"))
    .required()
    .messages({
      "string.pattern.base":
        "Password must be 3–30 characters and contain only letters and numbers",
    }),
  role: Joi.string()
    .valid("student", "instructor", "admin", "parent")
    .default("student"),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  newPassword: Joi.string()
    .pattern(new RegExp("^[a-zA-Z0-9]{3,30}$"))
    .required()
    .messages({
      "string.pattern.base":
        "Password must be 3–30 characters and contain only letters and numbers",
    }),
});

export { signupSchema, forgotPasswordSchema, resetPasswordSchema };
