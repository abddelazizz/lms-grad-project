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
import { securityLog, auditLog } from "../utilis/logger.js";
import { buildBaseUsername, ensureUniqueUsername, defaultProfilePictureUrl, sanitizeUsername } from "../utilis/userDefaults.js";

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

const signup = async ({ name, username, email, password, role, picture }) => {
  const existingUser = await User.findOne({ where: { email } });

  if (existingUser) {
    // Differentiate so the frontend can show the "resend verification" button
    if (existingUser.is_verified) {
      throw new AppError("Email already exists.", 409);
    }
    throw new AppError("Email already registered but not verified.", 409);
  }

  const hashedPassword = await hashPassword(password);

  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = hashToken(rawToken);
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const desiredBaseUsername = buildBaseUsername({ username, email, name });

  // If the user explicitly provided a username, enforce uniqueness with a clear error.
  if (sanitizeUsername(username)) {
    const foundUsername = await User.findOne({ where: { username: desiredBaseUsername } });
    if (foundUsername) {
      throw new AppError("Username already exists.", 409);
    }
  }

  const finalUsername = await ensureUniqueUsername(desiredBaseUsername);
  const finalPicture = picture?.trim?.() ? picture : defaultProfilePictureUrl(email);

  const user = await User.create({
    username: finalUsername,
    name,
    email,
    picture: finalPicture,
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
    // 🔐 Security log: failed login attempt (user not found)
    securityLog("FAILED_LOGIN_USER_NOT_FOUND", { email });
    throw new AppError("Invalid credentials.", 401);
  }

  if (!user.is_verified) {
    securityLog("FAILED_LOGIN_UNVERIFIED", { email, user_id: user.user_id });
    throw new AppError("Please verify your email before logging in.", 403);
  }

  const validPassword = await comparePassword(password, user.password);

  if (!validPassword) {
    // 🔐 Security log: failed login attempt (wrong password)
    securityLog("FAILED_LOGIN_WRONG_PASSWORD", { email, user_id: user.user_id });
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

  if (!user) return; // silent: don't reveal if email exists

  // Generate a random 6-digit OTP
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiry = new Date(Date.now() + 10 * 60 * 1000); // Short expiry for OTP (10 mins)

  user.reset_password_token = otpCode;
  user.reset_password_expires = expiry;
  await user.save();

  await sendPasswordResetEmail(email, otpCode);
};

const verifyResetOTP = async (email, otp) => {
  const user = await User.findOne({ where: { email, reset_password_token: otp } });

  if (!user) {
    throw new AppError("Invalid or expired reset code.", 400);
  }

  if (user.reset_password_expires < new Date()) {
    throw new AppError("Reset code has expired. Please request a new one.", 400);
  }

  return true;
};

const resetPassword = async (email, otp, newPassword) => {
  const user = await User.findOne({ where: { email, reset_password_token: otp } });

  if (!user) {
    throw new AppError("Invalid or expired reset code.", 400);
  }

  if (user.reset_password_expires < new Date()) {
    throw new AppError("Reset code has expired. Please request a new one.", 400);
  }

  user.password = await hashPassword(newPassword);
  user.reset_password_token = null;
  user.reset_password_expires = null;
  await user.save();

  // 📋 Audit log: password changed
  auditLog("PASSWORD_RESET", user.user_id, "user", user.user_id);
};

const resendVerification = async (email) => {
  const user = await User.findOne({ where: { email } });

  // Silent: don't reveal whether the account exists
  if (!user) return;

  if (user.is_verified) {
    throw new AppError("Email is already verified. You can log in.", 400);
  }

  // Issue a fresh 24-hour verification token
  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = hashToken(rawToken);
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  user.verification_token = hashedToken;
  user.verification_token_expires = expires;
  await user.save();

  await sendVerificationEmail(email, rawToken);
};

const googleAuth = async (googleId, name, email, picture) => {
  // Case 1: User already signed in with Google before
  let user = await User.findOne({ where: { google_id: googleId } });
  if (user) {
    if (picture) await user.update({ picture }); // Update picture if it changed
    if (!user.picture) await user.update({ picture: defaultProfilePictureUrl(email) });
    const token = generateToken(user);
    return { user, token };
  }

  // Case 2: User registered before with email/password — link their Google account
  user = await User.findOne({ where: { email } });
  if (user) {
    await user.update({
      google_id: googleId,
      picture: picture || user.picture || defaultProfilePictureUrl(email),
      is_verified: true,
      email_verified_at: user.email_verified_at || new Date(),
    });
    const token = generateToken(user);
    return { user, token };
  }

  // Case 3: Brand new user — create account
  const baseUsername = buildBaseUsername({ email, name });
  const finalUsername = await ensureUniqueUsername(baseUsername);
  const finalPicture = picture || defaultProfilePictureUrl(email);

  user = await User.create({
    google_id: googleId,
    username: finalUsername,
    name,
    email,
    picture: finalPicture,
    is_verified: true,
    email_verified_at: new Date(),
    role: 'student',
  });

  const token = generateToken(user);
  return { user, token };
};

export { signup, verifyEmail, login, forgotPassword, verifyResetOTP, resetPassword, resendVerification, googleAuth };
