import crypto from "crypto";
import { User } from "../models/index.js";
import { hashPassword, comparePassword, generateToken, sendVerificationEmail, sendPasswordResetEmail } from "../utilis/index.js";

const signup = async (name, email, password, role) => {
  const existingUser = await User.findOne({ where: { email } });

  if (existingUser) {
    throw new Error("Email already exists");
  }

  const hashedPassword = await hashPassword(password);
  const verificationToken = crypto.randomBytes(32).toString("hex");

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role,
    verification_token: verificationToken,
  });

  await sendVerificationEmail(email, verificationToken);

  return user;
};

const login = async (email, password) => {
  const user = await User.findOne({ where: { email } });

  if (!user) {
    throw new Error("Invalid credentials");
  }

  if (!user.is_verified) {
    throw new Error("Please verify your email before logging in");
  }

  const validPassword = await comparePassword(password, user.password);

  if (!validPassword) {
    throw new Error("Invalid credentials");
  }

  const token = generateToken(user);

  const { password: _password, verification_token: _vt, ...safeUser } = user.toJSON();
  return { user: safeUser, token };
};

const forgotPassword = async (email) => {
  const user = await User.findOne({ where: { email } });

  if (!user) {
    // Silently return — do not reveal whether the email is registered
    return;
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  user.reset_password_token = resetToken;
  user.reset_password_expires = expiry;
  await user.save();

  await sendPasswordResetEmail(email, resetToken);
};

const resetPassword = async (token, newPassword) => {
  const user = await User.findOne({
    where: { reset_password_token: token },
  });

  if (!user) {
    throw new Error("Invalid or expired reset token");
  }

  if (user.reset_password_expires < new Date()) {
    throw new Error("Reset token has expired. Please request a new one");
  }

  user.password = await hashPassword(newPassword);
  user.reset_password_token = null;
  user.reset_password_expires = null;
  await user.save();
};

export { signup, login, forgotPassword, resetPassword };
