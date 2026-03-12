import crypto from "crypto";
import { User } from "../models/index.js";
import {
  hashPassword,
  comparePassword,
  generateToken,
  sendVerificationEmail,
  sendPasswordResetEmail,
  AppError,
} from "../utilis/index.js";

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

const signup = async (name, email, password, role) => {
  const existingUser = await User.findOne({ where: { email } });

  if (existingUser) {
    throw new AppError("Email already exists.", 409);
  }

  const hashedPassword = await hashPassword(password);

  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = hashToken(rawToken);
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role,
    verification_token: hashedToken,
    verification_token_expires: expires,
  });

  await sendVerificationEmail(email, rawToken);

  return user;
};

const verifyEmail = async (rawToken) => {
  const hashedToken = hashToken(rawToken);

  const user = await User.findOne({ where: { verification_token: hashedToken } });

  if (!user) {
    throw new AppError("Invalid or expired verification token.", 400);
  }

  if (user.verification_token_expires < new Date()) {
    throw new AppError("Verification token has expired. Please sign up again.", 400);
  }

  user.is_verified = true;
  user.email_verified_at = new Date();
  user.verification_token = null;
  user.verification_token_expires = null;

  await user.save();
};

const login = async (email, password) => {
  const user = await User.findOne({ where: { email } });

  if (!user) {
    throw new AppError("Invalid credentials.", 401);
  }

  if (!user.is_verified) {
    throw new AppError("Please verify your email before logging in.", 403);
  }

  const validPassword = await comparePassword(password, user.password);

  if (!validPassword) {
    throw new AppError("Invalid credentials.", 401);
  }

  const token = generateToken(user);

  const {
    password: _password,
    verification_token: _vt,
    verification_token_expires: _vte,
    reset_password_token: _rpt,
    reset_password_expires: _rpe,
    ...safeUser
  } = user.toJSON();

  return { user: safeUser, token };
};

const forgotPassword = async (email) => {
  const user = await User.findOne({ where: { email } });

  if (!user) return;

  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = hashToken(rawToken);
  const expiry = new Date(Date.now() + 60 * 60 * 1000);

  user.reset_password_token = hashedToken;
  user.reset_password_expires = expiry;
  await user.save();

  await sendPasswordResetEmail(email, rawToken);
};

const resetPassword = async (rawToken, newPassword) => {
  const hashedToken = hashToken(rawToken);

  const user = await User.findOne({ where: { reset_password_token: hashedToken } });

  if (!user) {
    throw new AppError("Invalid or expired reset token.", 400);
  }

  if (user.reset_password_expires < new Date()) {
    throw new AppError("Reset token has expired. Please request a new one.", 400);
  }

  user.password = await hashPassword(newPassword);
  user.reset_password_token = null;
  user.reset_password_expires = null;
  await user.save();
};

const googleAuth = async (googleId, name, email) => {
  let user = await User.findOne({ where: { google_id: googleId } });

  if (!user) {
    user = await User.create({
      google_id: googleId,
      name,
      email,
      is_verified: true,
      email_verified_at: new Date(),
    });
  }

  return user;
};

export { signup, verifyEmail, login, forgotPassword, resetPassword, googleAuth };
