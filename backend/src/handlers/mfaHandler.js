import * as mfaService from "../services/mfaService.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/AppError.js";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/api/auth",
};

const setupMFA = catchAsync(async (req, res) => {
  const userId = req.user.user_id;
  const result = await mfaService.setupMFA(userId);

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: result,
  });
});

const verifyAndEnableMFA = catchAsync(async (req, res) => {
  const userId = req.user.user_id;
  const { totpCode } = req.body;

  if (!totpCode) {
    throw new AppError("Verification code is required.", 400);
  }

  const result = await mfaService.verifyAndEnableMFA(userId, totpCode);

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: "MFA enabled successfully. Save your recovery codes in a safe place.",
    data: result,
  });
});

const verifyMFALogin = catchAsync(async (req, res) => {
  const { userId, totpCode, tempToken } = req.body;

  if (!userId || !totpCode || !tempToken) {
    throw new AppError("userId, totpCode, and tempToken are required.", 400);
  }

  const deviceInfo = { userAgent: req.headers["user-agent"] };
  const ipAddress = req.ip || req.connection.remoteAddress;

  const result = await mfaService.verifyMFALogin(userId, totpCode, tempToken, deviceInfo, ipAddress);

  res.cookie("refreshToken", result.refreshToken, COOKIE_OPTIONS);

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: "MFA verification successful.",
    user: result.user,
    token: result.token,
  });
});

const recoverWithCode = catchAsync(async (req, res) => {
  const { userId, recoveryCode, tempToken } = req.body;

  if (!userId || !recoveryCode) {
    throw new AppError("userId and recoveryCode are required.", 400);
  }

  const deviceInfo = { userAgent: req.headers["user-agent"] };
  const ipAddress = req.ip || req.connection.remoteAddress;

  const result = await mfaService.recoverWithCode(userId, recoveryCode, deviceInfo, ipAddress);

  res.cookie("refreshToken", result.refreshToken, COOKIE_OPTIONS);

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: "Recovery code accepted. MFA bypassed for this session.",
    user: result.user,
    token: result.token,
  });
});

const disableMFA = catchAsync(async (req, res) => {
  const userId = req.user.user_id;
  const { password, totpCode } = req.body;

  if (!password || !totpCode) {
    throw new AppError("Password and verification code are required.", 400);
  }

  const result = await mfaService.disableMFA(userId, password, totpCode);

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: result.message,
  });
});

export { setupMFA, verifyAndEnableMFA, verifyMFALogin, recoverWithCode, disableMFA };
