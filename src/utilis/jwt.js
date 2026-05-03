import jwt from "jsonwebtoken";

const generateToken = (user) => {
  return jwt.sign(
    {
      user_id: user.user_id,
      role: user.role,
      picture: user.picture,
      token_version: user.token_version ?? 0,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "15m",
    }
  );
};

export { generateToken };
