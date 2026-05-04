import rateLimit from "express-rate-limit";
import AppError from "../utils/AppError.js";

const handler = (message) => (req, res, next) => {
  next(new AppError(message, 429));
};

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: handler("Too many requests. Please try again later."),
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 5 : 50,
  standardHeaders: true,
  legacyHeaders: false,
  handler: handler("Too many authentication attempts. Please try again in 15 minutes."),
});

export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  handler: handler("Too many password reset attempts. Please try again in an hour."),
});

export const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: handler("Too many OTP verification attempts. Please try again later."),
});

export const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  handler: handler("Too many contact form submissions. Please try again later."),
});
