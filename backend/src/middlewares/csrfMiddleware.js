import { generateToken, validateToken } from "csrf-sync";

const { csrfProtection, generateCsrfToken } = generateToken();

const csrfMiddleware = (req, res, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  const csrfToken = req.headers["x-csrf-token"];
  if (!csrfToken) {
    return next(new Error("CSRF token missing"));
  }

  try {
    validateToken(csrfToken);
    next();
  } catch {
    return next(new Error("Invalid CSRF token"));
  }
};

export { csrfMiddleware, generateCsrfToken };
