import * as authService from "../services/index.js";
import catchAsync from "../utilis/catchAsync.js";
import AppError from "../utilis/AppError.js";
// generateToken is generated in the service layer now

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
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  if (!token) {
    return res.redirect(`${frontendUrl}/login?error=missing_token`);
  }

  try {
    await authService.verifyEmail(token);
    return res.redirect(`${frontendUrl}/login?verified=true`);
  } catch (err) {
    // Redirect to login with error parameter so frontend can render an elegant toast
    return res.redirect(`${frontendUrl}/login?error=invalid_or_expired_token`);
  }
};

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



const googleAuthCallback = (req, res, next) => {
  try {
    const context = req.user;

    if (!context || !context.user || !context.token) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=google_auth_failed`);
    }

    // Redirect browser back to frontend with JWT token in URL
    // The frontend will extract the token and store it in localStorage
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/google/success?token=${context.token}`);
  } catch (err) {
    next(err);
  }
};

export { signup, login, verifyEmail, forgotPassword, verifyResetOTP, resetPassword, resendVerification, googleAuthCallback };
