import jwt from "jsonwebtoken";
import AppError from "../utils/AppError.js";
import { User } from "../models/index.js";
import redis from "../config/redis.js";

const USER_CACHE_TTL = 60; // seconds

const getCachedUser = async (userId) => {
  const cacheKey = `user_cache:${userId}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const user = await User.findByPk(userId, {
    attributes: ["user_id", "role", "picture", "token_version", "mfa_enabled"],
  });
  if (!user) return null;

  await redis.set(cacheKey, JSON.stringify(user.toJSON()), "EX", USER_CACHE_TTL);
  return user.toJSON();
};

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new AppError("Access denied. No token provided.", 401));
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await getCachedUser(decoded.user_id);
    if (!user) {
      return next(new AppError("User no longer exists.", 401));
    }

    if (user.token_version !== decoded.token_version) {
      return next(new AppError("Token has been revoked. Please log in again.", 401));
    }

    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return next(new AppError("Session expired. Please log in again.", 401));
    }
    next(new AppError("Invalid or expired token.", 401));
  }
};

const optionalAuthenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next();
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await getCachedUser(decoded.user_id);
    if (user && user.token_version === decoded.token_version) {
      req.user = decoded;
    }
    next();
  } catch (error) {
    // Silently fail for optional auth
    next();
  }
};

export { authenticate as default, optionalAuthenticate };
