import AppError from "../utilis/AppError.js";

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const messages = error.details.map((detail) => detail.message);
      return next(new AppError(messages.join(". "), 400));
    }

    next();
  };
};

export default validate;

