import AppError from "../utilis/AppError.js";

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError("Not authenticated. Please log in.", 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You are not allowed to access this resource.", 403)
      );
    }

    next();
  };
};

export default authorizeRoles;

