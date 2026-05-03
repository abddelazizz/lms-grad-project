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
import { createStudentAccount, ensureStudentProfile } from "./adminService.js";
import {
  generateAccessToken,
  generateRefreshToken,
  validateRefreshToken,
  revokeRefreshToken,
  revokeAllRefreshTokens,
  rotateRefreshToken,
  publishTokenRevocation,
} from "./tokenService.js";

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 30;

const signup = async ({ name, username, email, password, role, picture, gradeLevel, parentId }) => {
  const existingUser = await User.findOne({ where: { email } });

  if (existingUser) {
    if (existingUser.is_verified) {
      throw new AppError("Email already exists.", 409);
    }
    throw new AppError("Email already registered but not verified.", 409);
  }

  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = hashToken(rawToken);
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  let user;

  if (role === "student") {
    ({ user } = await createStudentAccount({
      name,
      username,
      email,
      password,
      picture: picture?.trim?.() ? picture : null,
      gradeLevel,
      parentId,
      isVerified: false,
      verificationToken: hashedToken,
      verificationTokenExpires: expires,
    }));
  } else {
    const hashedPassword = await hashPassword(password);
    const desiredBaseUsername = buildBaseUsername({ username, email, name });

    if (sanitizeUsername(username)) {
      const foundUsername = await User.findOne({ where: { username: desiredBaseUsername } });
      if (foundUsername) {
        throw new AppError("Username already exists.", 409);
      }
    }

    const finalUsername = await ensureUniqueUsername(desiredBaseUsername);
    const finalPicture = picture?.trim?.() ? picture : defaultProfilePictureUrl(email);

    user = await User.create({
      username: finalUsername,
      name,
      email,
      picture: finalPicture,
      password: hashedPassword,
      role,
      verification_token: hashedToken,
      verification_token_expires: expires,
    });
  }

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

const login = async (email, password, deviceInfo = {}, ipAddress = "") => {
  const user = await User.findOne({ where: { email } });

  if (!user) {
    securityLog("FAILED_LOGIN_USER_NOT_FOUND", { email });
    throw new AppError("Invalid credentials.", 401);
  }

  if (user.locked_until && user.locked_until > new Date()) {
    const remainingMinutes = Math.ceil((user.locked_until - new Date()) / 60000);
    securityLog("LOGIN_ATTEMPT_WHILE_LOCKED", { email, user_id: user.user_id });
    throw new AppError(`Account locked. Try again in ${remainingMinutes} minutes.`, 423);
  }

  if (!user.is_verified) {
    securityLog("FAILED_LOGIN_UNVERIFIED", { email, user_id: user.user_id });
    throw new AppError("Please verify your email before logging in.", 403);
  }

  if (!user.password) {
    securityLog("FAILED_LOGIN_NO_PASSWORD_SET", { email, user_id: user.user_id });
    throw new AppError("This account was created using a social login. Please log in with Google or reset your password.", 401);
  }

  const validPassword = await comparePassword(password, user.password);

  if (!validPassword) {
    const newAttempts = user.failed_login_attempts + 1;

    if (newAttempts >= MAX_FAILED_ATTEMPTS) {
      user.failed_login_attempts = newAttempts;
      user.locked_until = new Date(Date.now() + LOCK_DURATION_MINUTES * 60 * 1000);
      await user.save();
      securityLog("ACCOUNT_LOCKED", { email, user_id: user.user_id, attempts: newAttempts });
      throw new AppError(`Account locked due to too many failed attempts. Try again in ${LOCK_DURATION_MINUTES} minutes.`, 423);
    }

    user.failed_login_attempts = newAttempts;
    await user.save();
    securityLog("FAILED_LOGIN_WRONG_PASSWORD", { email, user_id: user.user_id, attempts: newAttempts });
    throw new AppError("Invalid credentials.", 401);
  }

  user.failed_login_attempts = 0;
  user.locked_until = null;
  await user.save();

  if (user.mfa_enabled) {
    const tempToken = crypto.randomBytes(32).toString("hex");
    const tempTokenHash = hashToken(tempToken);
    const { default: redis } = await import("../config/redis.js");
    await redis.set(`mfa_pending:${user.user_id}`, tempTokenHash, "EX", 300); // 5 min

    const {
      password: _password,
      verification_token: _vt,
      verification_token_expires: _vte,
      reset_password_token: _rpt,
      reset_password_expires: _rpe,
      mfa_secret: _ms,
      ...safeUser
    } = user.toJSON();

    return { user: safeUser, mfaRequired: true, tempToken, userId: user.user_id };
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = await generateRefreshToken(user, deviceInfo, ipAddress);

  const {
    password: _password,
    verification_token: _vt,
    verification_token_expires: _vte,
    reset_password_token: _rpt,
    reset_password_expires: _rpe,
    mfa_secret: _ms,
    ...safeUser
  } = user.toJSON();

  return { user: safeUser, token: accessToken, refreshToken, mfaRequired: false };
};

const refreshAccessToken = async (refreshToken, deviceInfo = {}, ipAddress = "") => {
  if (!refreshToken) {
    throw new AppError("No refresh token provided.", 401);
  }

  const [userId, tokenId] = refreshToken.split(":");
  if (!userId || !tokenId) {
    throw new AppError("Invalid or expired refresh token.", 401);
  }

  const stored = await validateRefreshToken(userId, tokenId);
  if (!stored) {
    throw new AppError("Refresh token has been revoked.", 401);
  }

  const user = await User.findByPk(userId);
  if (!user) {
    throw new AppError("User no longer exists.", 401);
  }

  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = await rotateRefreshToken(user.user_id, tokenId, deviceInfo, ipAddress);

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

const logout = async (userId, refreshToken) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new AppError("User not found.", 404);
  }

  user.token_version += 1;
  await user.save();

  if (refreshToken) {
    const [, tokenId] = refreshToken.split(":");
    if (tokenId) {
      await revokeRefreshToken(userId, tokenId);
    }
  }
  await revokeAllRefreshTokens(userId);
  await publishTokenRevocation(userId);

  const { default: redis } = await import("../config/redis.js");
  await redis.del(`user_cache:${userId}`);

  auditLog("LOGOUT", userId, "user", userId);
};

const forgotPassword = async (email) => {
  const user = await User.findOne({ where: { email } });

  if (!user) return;

  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedOtp = hashToken(otpCode);
  const expiry = new Date(Date.now() + 10 * 60 * 1000);

  user.reset_password_token = hashedOtp;
  user.reset_password_expires = expiry;
  await user.save();

  await sendPasswordResetEmail(email, otpCode);
};

const verifyResetOTP = async (email, otp) => {
  const hashedOtp = hashToken(otp);
  const user = await User.findOne({ where: { email, reset_password_token: hashedOtp } });

  if (!user) {
    throw new AppError("Invalid or expired reset code.", 400);
  }

  if (user.reset_password_expires < new Date()) {
    throw new AppError("Reset code has expired. Please request a new one.", 400);
  }

  return true;
};

const resetPassword = async (email, otp, newPassword) => {
  const hashedOtp = hashToken(otp);
  const user = await User.findOne({ where: { email, reset_password_token: hashedOtp } });

  if (!user) {
    throw new AppError("Invalid or expired reset code.", 400);
  }

  if (user.reset_password_expires < new Date()) {
    throw new AppError("Reset code has expired. Please request a new one.", 400);
  }

  user.password = await hashPassword(newPassword);
  user.reset_password_token = null;
  user.reset_password_expires = null;
  user.token_version += 1;
  user.password_changed_at = new Date();
  await user.save();

  await revokeAllRefreshTokens(user.user_id);
  await publishTokenRevocation(user.user_id);

  auditLog("PASSWORD_RESET", user.user_id, "user", user.user_id);
};

const resendVerification = async (email) => {
  const user = await User.findOne({ where: { email } });

  if (!user) return;

  if (user.is_verified) {
    throw new AppError("Email is already verified. You can log in.", 400);
  }

  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = hashToken(rawToken);
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  user.verification_token = hashedToken;
  user.verification_token_expires = expires;
  await user.save();

  await sendVerificationEmail(email, rawToken);
};

const googleAuth = async (googleId, name, email, picture) => {
  let user = await User.findOne({ where: { google_id: googleId } });
  if (user) {
    if (picture) await user.update({ picture });
    if (!user.picture) await user.update({ picture: defaultProfilePictureUrl(email) });
    if (user.role === "student") {
      await ensureStudentProfile(user.user_id);
    }
    const token = generateAccessToken(user);
    return { user, token };
  }

  user = await User.findOne({ where: { email } });
  if (user) {
    await user.update({
      google_id: googleId,
      picture: picture || user.picture || defaultProfilePictureUrl(email),
      is_verified: true,
      email_verified_at: user.email_verified_at || new Date(),
    });
    if (user.role === "student") {
      await ensureStudentProfile(user.user_id);
    }
    const token = generateAccessToken(user);
    return { user, token };
  }

  ({ user } = await createStudentAccount({
    name,
    email,
    picture: picture || null,
    googleId,
    isVerified: true,
    emailVerifiedAt: new Date(),
  }));

  const token = generateAccessToken(user);
  return { user, token };
};

export {
  signup,
  verifyEmail,
  login,
  refreshAccessToken,
  logout,
  forgotPassword,
  verifyResetOTP,
  resetPassword,
  resendVerification,
  googleAuth,
};
