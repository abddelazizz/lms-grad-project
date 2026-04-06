import * as authService from "../services/index.js";
import catchAsync from "../utilis/catchAsync.js";
import AppError from "../utilis/AppError.js";
// generateToken is generated in the service layer now

const signup = catchAsync(async (req, res) => {
  const { name, email, password, role } = req.body;

  const user = await authService.signup(name, email, password, role);

  res.status(201).json({
    success: true,
    statusCode: 201,
    message: "User created successfully. Please check your email to verify your account.",
    user,
  });
});

const verifyEmail = catchAsync(async (req, res, next) => {
  const { token } = req.query;

  if (!token) {
    return next(new AppError("Verification token is required.", 400));
  }

  await authService.verifyEmail(token);

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: "Email verified successfully. You can now log in.",
  });
});

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  const result = await authService.login(email, password);

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: "Logged in successfully.",
    ...result,
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

const resetPassword = catchAsync(async (req, res) => {
  const { token, newPassword } = req.body;

  await authService.resetPassword(token, newPassword);

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



const googleAuthCallback = (req, res, next) => {
  try {
    const context = req.user;

    if (!context || !context.user || !context.token) {
      return next(new AppError("Google authentication failed.", 401));
    }

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Logged in with Google successfully.",
      token: context.token,
      user: context.user,
    });
  } catch (err) {
    next(err);
  }
};

export { signup, login, verifyEmail, forgotPassword, resetPassword, resendVerification, googleAuthCallback };

