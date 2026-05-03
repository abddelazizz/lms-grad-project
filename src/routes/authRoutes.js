import express from "express";
import passport from "passport";
import { signup, login, verifyEmail, forgotPassword, verifyResetOTP, resetPassword, googleAuthCallback, resendVerification, refreshToken, logout, getSessions, revokeSession, revokeAllSessions } from "../handlers/index.js";
import { validate, authenticate } from "../middlewares/index.js";
import { signupSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, resendVerificationSchema, verifyOtpSchema } from "../validations/index.js";

const router = express.Router();

router.post("/signup", validate(signupSchema), signup);
router.post("/login", validate(loginSchema), login);
router.get("/verify-email", verifyEmail);
router.post("/forgot-password", validate(forgotPasswordSchema), forgotPassword);
router.post("/resend-verification", validate(resendVerificationSchema), resendVerification);
router.post("/verify-reset-otp", validate(verifyOtpSchema), verifyResetOTP);
router.post("/reset-password", validate(resetPasswordSchema), resetPassword);
router.post("/refresh", refreshToken);
router.post("/logout", authenticate, logout);
router.get("/sessions", authenticate, getSessions);
router.delete("/sessions/:tokenId", authenticate, revokeSession);
router.delete("/sessions", authenticate, revokeAllSessions);

router.get("/google", passport.authenticate("google", { scope: ["profile", "email"], session: false }));

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failWithError: true }),
  googleAuthCallback
);

export default router;
