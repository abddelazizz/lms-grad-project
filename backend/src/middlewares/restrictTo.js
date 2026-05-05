import AppError from "../utils/AppError.js";

const restrictTo = (...roles) => {
  return (req, res, next) => {
    // protect MUST run before this
    if (!req.user) {
      return next(new AppError("User not authenticated", 401));
    }

    if (!roles.includes(req.user.role)) {
      console.warn(`[RestrictTo] Access denied for user ${req.user.user_id}. Role ${req.user.role} not in [${roles.join(', ')}]`);
      return next(
        new AppError("You do not have permission to perform this action", 403)
      );
    }

    next();
  };
};

export default restrictTo;
