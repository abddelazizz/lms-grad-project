import { generateSecret, generateSync, verifySync, generateURI } from "otplib";
import bcrypt from "bcrypt";
import crypto from "crypto";
import QRCode from "qrcode";
import { User } from "../models/index.js";
import { AppError } from "../utilis/index.js";
import { auditLog } from "../utilis/logger.js";
import redis from "../config/redis.js";
import { generateAccessToken, generateRefreshToken, revokeAllRefreshTokens, publishTokenRevocation } from "./tokenService.js";

const SETUP_TTL = 300;
const RECOVERY_CODE_COUNT = 10;

const setupMFA = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new AppError("User not found.", 404);
  }

  if (user.mfa_enabled) {
    throw new AppError("MFA is already enabled for this account.", 400);
  }

  const secret = generateSecret();
  const setupKey = `mfa_setup:${userId}`;
  await redis.set(setupKey, secret, "EX", SETUP_TTL);

  const otpAuth = generateURI({
    secret,
    accountName: user.email,
    issuer: "Recode Academy",
    type: "totp",
  });

  const qrCodeDataUrl = await QRCode.toDataURL(otpAuth);

  return { secret, qrCode: qrCodeDataUrl, manualEntry: otpAuth };
};

const verifyAndEnableMFA = async (userId, totpCode) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new AppError("User not found.", 404);
  }

  const setupKey = `mfa_setup:${userId}`;
  const secret = await redis.get(setupKey);
  if (!secret) {
    throw new AppError("MFA setup session expired. Please start again.", 400);
  }

  const result = verifySync({ token: totpCode, secret, type: "totp" });
  if (!result.valid) {
    throw new AppError("Invalid verification code. Please try again.", 400);
  }

  const recoveryCodes = [];
  const recoveryCodeHashes = [];

  for (let i = 0; i < RECOVERY_CODE_COUNT; i++) {
    const code = crypto.randomBytes(4).toString("hex");
    recoveryCodes.push(code);
    const hashedCode = await bcrypt.hash(code, 12);
    recoveryCodeHashes.push(hashedCode);
  }

  user.mfa_enabled = true;
  user.mfa_secret = secret;
  await user.save();

  for (let i = 0; i < recoveryCodeHashes.length; i++) {
    await redis.set(
      `recovery:${userId}:${i}`,
      recoveryCodeHashes[i],
      "EX",
      365 * 24 * 60 * 60
    );
  }

  await redis.del(setupKey);

  auditLog("MFA_ENABLED", userId, "user", userId);

  return { recoveryCodes };
};

const verifyMFALogin = async (userId, totpCode, tempToken, deviceInfo = {}, ipAddress = "") => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new AppError("User not found.", 404);
  }

  if (!user.mfa_enabled) {
    throw new AppError("MFA is not enabled for this account.", 400);
  }

  const pendingKey = `mfa_pending:${userId}`;
  const storedHash = await redis.get(pendingKey);
  if (!storedHash) {
    throw new AppError("MFA session expired. Please log in again.", 401);
  }

  const tempTokenHash = crypto.createHash("sha256").update(tempToken).digest("hex");
  if (storedHash !== tempTokenHash) {
    throw new AppError("Invalid MFA session.", 401);
  }

  const result = verifySync({ token: totpCode, secret: user.mfa_secret, type: "totp" });
  if (!result.valid) {
    throw new AppError("Invalid verification code.", 401);
  }

  await redis.del(pendingKey);

  user.failed_login_attempts = 0;
  user.locked_until = null;
  await user.save();

  const accessToken = generateAccessToken(user);
  const refreshToken = await generateRefreshToken(user, deviceInfo, ipAddress);

  const {
    password: _password,
    mfa_secret: _ms,
    verification_token: _vt,
    verification_token_expires: _vte,
    reset_password_token: _rpt,
    reset_password_expires: _rpe,
    ...safeUser
  } = user.toJSON();

  auditLog("MFA_LOGIN_SUCCESS", userId, "user", userId);

  return { user: safeUser, token: accessToken, refreshToken };
};

const recoverWithCode = async (userId, recoveryCode, deviceInfo = {}, ipAddress = "") => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new AppError("User not found.", 404);
  }

  if (!user.mfa_enabled) {
    throw new AppError("MFA is not enabled for this account.", 400);
  }

  let matchedIndex = -1;
  for (let i = 0; i < RECOVERY_CODE_COUNT; i++) {
    const storedHash = await redis.get(`recovery:${userId}:${i}`);
    if (storedHash) {
      const isMatch = await bcrypt.compare(recoveryCode, storedHash);
      if (isMatch) {
        matchedIndex = i;
        break;
      }
    }
  }

  if (matchedIndex === -1) {
    throw new AppError("Invalid recovery code.", 401);
  }

  await redis.del(`recovery:${userId}:${matchedIndex}`);

  const accessToken = generateAccessToken(user);
  const refreshToken = await generateRefreshToken(user, deviceInfo, ipAddress);

  const {
    password: _password,
    mfa_secret: _ms,
    verification_token: _vt,
    verification_token_expires: _vte,
    reset_password_token: _rpt,
    reset_password_expires: _rpe,
    ...safeUser
  } = user.toJSON();

  auditLog("MFA_RECOVERY_USED", userId, "user", userId);

  return { user: safeUser, token: accessToken, refreshToken };
};

const disableMFA = async (userId, password, totpCode) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new AppError("User not found.", 404);
  }

  if (!user.mfa_enabled) {
    throw new AppError("MFA is not enabled for this account.", 400);
  }

  if (user.password) {
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new AppError("Incorrect password.", 401);
    }
  }

  const result = verifySync({ token: totpCode, secret: user.mfa_secret, type: "totp" });
  if (!result.valid) {
    throw new AppError("Invalid verification code.", 401);
  }

  user.mfa_enabled = false;
  user.mfa_secret = null;
  await user.save();

  const pattern = `recovery:${userId}:*`;
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }

  user.token_version += 1;
  await user.save();
  await revokeAllRefreshTokens(userId);
  await publishTokenRevocation(userId);
  await redis.del(`user_cache:${userId}`);

  auditLog("MFA_DISABLED", userId, "user", userId);

  return { message: "MFA has been disabled successfully." };
};

export { setupMFA, verifyAndEnableMFA, verifyMFALogin, recoverWithCode, disableMFA };
