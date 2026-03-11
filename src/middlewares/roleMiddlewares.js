const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: "You are not allowed to access this resource",
      });
    }

    next();
  };
};

export default authorizeRoles;
