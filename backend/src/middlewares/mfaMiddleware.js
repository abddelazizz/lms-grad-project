import AppError from "../utils/AppError.js";
import { User } from "../models/index.js";

const requireMFA = (req, res, next) => {
  if (!req.user) {
    return next(new AppError("Not authenticated. Please log in.", 401));
  }

  next();
};

const enforceMFAForAdmin = async (req, res, next) => {
  if (!req.user) {
    return next(new AppError("Not authenticated. Please log in.", 401));
  }

  if (req.user.role === "admin") {
    const user = await User.findByPk(req.user.user_id, {
      attributes: ["mfa_enabled"],
    });
    if (user && !user.mfa_enabled) {
      return next(new AppError("Admin accounts must have MFA enabled. Please enable MFA in your settings.", 403));
    }
  }

  next();
};

export { requireMFA, enforceMFAForAdmin };
