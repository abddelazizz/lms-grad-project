import AppError from "../utilis/AppError.js";

const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const messages = error.details.map((detail) => detail.message);
      return next(new AppError(messages.join(". "), 400));
    }

    // Apply Joi defaults + sanitized payload back to request
    req.body = value;
    next();
  };
};

export default validate;
