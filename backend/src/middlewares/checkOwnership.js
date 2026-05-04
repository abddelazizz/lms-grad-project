import AppError from "../utils/AppError.js";

const checkOwnership = (req, res, next) => {
  // Check if the authenticated user is accessing their own resource or is an admin
  if (req.user.user_id !== parseInt(req.params.id) && req.user.role !== "admin") {
    return next(new AppError("Forbidden: You cannot modify another user's profile.", 403));
  }
  next();
};

export default checkOwnership;
