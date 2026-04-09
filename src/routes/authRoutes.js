import express from "express";
import passport from "passport";
import { signup, login, verifyEmail, forgotPassword, verifyResetOTP, resetPassword, googleAuthCallback, resendVerification } from "../handlers/index.js";
import { validate } from "../middlewares/index.js";
import { signupSchema, forgotPasswordSchema, resetPasswordSchema, resendVerificationSchema } from "../validations/index.js";

const router = express.Router();

router.post("/signup", validate(signupSchema), signup);
router.post("/login", login);
router.get("/verify-email", verifyEmail);
router.post("/forgot-password", validate(forgotPasswordSchema), forgotPassword);
router.post("/resend-verification", validate(resendVerificationSchema), resendVerification);
router.post("/verify-reset-otp", verifyResetOTP);
router.post("/reset-password", validate(resetPasswordSchema), resetPassword);

router.get("/google", passport.authenticate("google", { scope: ["profile", "email"], session: false }));

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failWithError: true }),
  googleAuthCallback
);

export default router;
