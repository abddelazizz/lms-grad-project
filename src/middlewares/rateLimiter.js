import rateLimit from "express-rate-limit";
import AppError from "../utilis/AppError.js";

// ─── General API Rate Limiter ────────────────────────────────
// Applied to all routes: 100 requests per 15 minutes per IP
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(new AppError("Too many requests. Please try again later.", 429));
  },
});

// ─── Auth Route Limiter (Strict) ─────────────────────────────
// Applied to /api/auth: 5 requests per 15 minutes per IP
// Protects against credential stuffing and brute force
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(
      new AppError(
        "Too many authentication attempts. Please try again in 15 minutes.",
        429
      )
    );
  },
});
