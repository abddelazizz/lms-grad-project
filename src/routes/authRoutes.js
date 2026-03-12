import express from "express";
import passport from "passport";
import { signup, login, verifyEmail, forgotPassword, resetPassword, googleAuthCallback } from "../handler/index.js";
import { validate } from "../middlewares/index.js";
import { signupSchema, forgotPasswordSchema, resetPasswordSchema } from "../validations/index.js";

const router = express.Router();

router.post("/signup", validate(signupSchema), signup);
router.post("/login", login);
router.get("/verify-email", verifyEmail);
router.post("/forgot-password", validate(forgotPasswordSchema), forgotPassword);
router.post("/reset-password", validate(resetPasswordSchema), resetPassword);

router.get("/google", passport.authenticate("google", { scope: ["profile", "email"], session: false }));

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failWithError: true }),
  googleAuthCallback
);

export default router;
