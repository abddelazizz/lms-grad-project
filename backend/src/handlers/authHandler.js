import * as authService from "../services/index.js";
import { getActiveSessions, revokeSession, revokeAllSessions } from "../services/sessionService.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/AppError.js";
import { generateRefreshToken } from "../services/tokenService.js";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/api/auth",
};

const signup = catchAsync(async (req, res) => {
  const { name, username, email, password, role, picture, gradeLevel, parentId } = req.body;

  const user = await authService.signup({
    name,
    username,
    email,
    password,
    role,
    picture,
    gradeLevel,
    parentId,
  });

  res.status(201).json({
    success: true,
    statusCode: 201,
    message: "User created successfully. Please check your email to verify your account.",
    user,
  });
});

const verifyEmail = async (req, res, next) => {
  const { token } = req.query;
  const frontendUrl = process.env.FRONTEND_URL || "https://learn.evolvesight.com";

  if (!token) {
    return res.redirect(`${frontendUrl}/login?error=missing_token`);
  }

  try {
    await authService.verifyEmail(token);
    return res.redirect(`${frontendUrl}/login?verified=true`);
  } catch (err) {
    return res.redirect(`${frontendUrl}/login?error=invalid_or_expired_token`);
  }
};

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const deviceInfo = { userAgent: req.headers["user-agent"] };
  const ipAddress = req.ip || req.connection.remoteAddress;

  const result = await authService.login(email, password, deviceInfo, ipAddress);

  if (result.mfaRequired) {
    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "MFA verification required.",
      mfaRequired: true,
      tempToken: result.tempToken,
      userId: result.userId,
      user: result.user,
    });
  }

  res.cookie("refreshToken", result.refreshToken, COOKIE_OPTIONS);

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: "Logged in successfully.",
    user: result.user,
    token: result.token,
  });
});

const refreshToken = catchAsync(async (req, res) => {
  const token = req.cookies?.refreshToken;

  if (!token) {
    throw new AppError("No refresh token provided.", 401);
  }

  const deviceInfo = { userAgent: req.headers["user-agent"] };
  const ipAddress = req.ip || req.connection.remoteAddress;

  const result = await authService.refreshAccessToken(token, deviceInfo, ipAddress);

  res.cookie("refreshToken", result.refreshToken, COOKIE_OPTIONS);

  res.status(200).json({
    success: true,
    statusCode: 200,
    token: result.accessToken,
  });
});

const logout = catchAsync(async (req, res) => {
  const token = req.cookies?.refreshToken;
  const userId = req.user?.user_id;

  if (userId) {
    await authService.logout(userId, token);
  }

  res.clearCookie("refreshToken", { path: "/api/auth" });

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: "Logged out successfully.",
  });
});

const forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;

  await authService.forgotPassword(email);

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: "If an account with that email exists, a reset link has been sent.",
  });
});

const verifyResetOTP = catchAsync(async (req, res) => {
  const { email, otp } = req.body;

  await authService.verifyResetOTP(email, otp);

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: "OTP verified correctly.",
  });
});

const resetPassword = catchAsync(async (req, res) => {
  const { email, otp, newPassword } = req.body;

  await authService.resetPassword(email, otp, newPassword);

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: "Password reset successfully. You can now log in.",
  });
});

const resendVerification = catchAsync(async (req, res) => {
  const { email } = req.body;

  await authService.resendVerification(email);

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: "Verification email resent successfully. Please check your inbox.",
  });
});

const googleAuthCallback = catchAsync(async (req, res) => {
  const context = req.user;

  if (!context || !context.user || !context.token) {
    return res.redirect(`${process.env.FRONTEND_URL || "https://learn.evolvesight.com"}/login?error=google_auth_failed`);
  }

  const deviceInfo = { userAgent: req.headers["user-agent"] };
  const ipAddress = req.ip || req.connection.remoteAddress;

  const refreshToken = await generateRefreshToken(context.user, deviceInfo, ipAddress);

  res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);

  res.redirect(`${process.env.FRONTEND_URL || "https://learn.evolvesight.com"}/auth/google/success?token=${context.token}`);
});

const getSessions = catchAsync(async (req, res) => {
  const userId = req.user.user_id;
  const sessions = await getActiveSessions(userId);

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: sessions,
  });
});

const revokeSessionById = catchAsync(async (req, res) => {
  const userId = req.user.user_id;
  const { tokenId } = req.params;

  await revokeSession(userId, tokenId);

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: "Session revoked successfully.",
  });
});

const revokeAllUserSessions = catchAsync(async (req, res) => {
  const userId = req.user.user_id;

  await revokeAllSessions(userId);

  res.clearCookie("refreshToken", { path: "/api/auth" });

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: "All sessions revoked successfully. Please log in again.",
  });
});

const setPasswordHandler = catchAsync(async (req, res) => {
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 8) {
    throw new AppError("Password must be at least 8 characters long.", 400);
  }

  await authService.setPassword(req.user.user_id, newPassword);

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: "Password set successfully. You can now log in with your email and password.",
  });
});

const changePasswordHandler = catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new AppError("Both currentPassword and newPassword are required.", 400);
  }

  if (newPassword.length < 8) {
    throw new AppError("New password must be at least 8 characters long.", 400);
  }

  await authService.changePassword(req.user.user_id, currentPassword, newPassword);

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: "Password changed successfully. Please log in again.",
  });
});

export {
  signup,
  login,
  verifyEmail,
  refreshToken,
  logout,
  forgotPassword,
  verifyResetOTP,
  resetPassword,
  resendVerification,
  googleAuthCallback,
  getSessions,
  revokeSessionById as revokeSession,
  revokeAllUserSessions as revokeAllSessions,
  setPasswordHandler as setPassword,
  changePasswordHandler as changePassword,
};
