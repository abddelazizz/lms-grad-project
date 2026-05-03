import AppError from "../utilis/AppError.js";

const handleSequelizeValidationError = (err) => {
  const messages = err.errors.map((e) => e.message);
  return new AppError(messages.join(". "), 422);
};

const handleSequelizeUniqueConstraintError = (err) => {
  const field = err.errors?.[0]?.path ?? "field";
  return new AppError(`Duplicate value for '${field}'. Please use a different value.`, 409);
};

const handleSequelizeDatabaseError = () =>
  new AppError("Database error. Please try again later.", 503);

const handleJwtError = () =>
  new AppError("Invalid token. Please log in again.", 401);

const handleJwtExpiredError = () =>
  new AppError("Your session has expired. Please log in again.", 401);

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    success: false,
    statusCode: err.statusCode,
    message: err.message,
    ...(err.errors && { errors: err.errors }),
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      statusCode: err.statusCode,
      message: err.message,
      ...(err.errors && { errors: err.errors }),
    });
  }

  console.error("UNEXPECTED ERROR:", err);
  res.status(500).json({
    success: false,
    statusCode: 500,
    message: "Something went wrong. Please try again later.",
  });
};

// eslint-disable-next-line no-unused-vars
const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  const env = process.env.NODE_ENV || "development";

  if (env === "development") {
    sendErrorDev(err, res);
  } else {
    let error = Object.assign(Object.create(Object.getPrototypeOf(err)), err);
    error.message = err.message;

    if (error.name === "SequelizeValidationError") {
      error = handleSequelizeValidationError(error);
    } else if (error.name === "SequelizeUniqueConstraintError") {
      error = handleSequelizeUniqueConstraintError(error);
    } else if (
      error.name === "SequelizeDatabaseError" ||
      error.name === "SequelizeConnectionError" ||
      error.name === "SequelizeConnectionRefusedError"
    ) {
      error = handleSequelizeDatabaseError();
    } else if (error.name === "JsonWebTokenError") {
      error = handleJwtError();
    } else if (error.name === "TokenExpiredError") {
      error = handleJwtExpiredError();
    }

    sendErrorProd(error, res);
  }
};

export default globalErrorHandler;
