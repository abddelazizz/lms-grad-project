import express from "express";
import { signup, login, verifyEmail, forgotPassword, resetPassword } from "../handler/index.js";
import { validate } from "../middlewares/index.js";
import { signupSchema, forgotPasswordSchema, resetPasswordSchema } from "../validations/index.js";

const router = express.Router();

router.post("/signup", validate(signupSchema), signup);
router.post("/login", login);
router.get("/verify/:token", verifyEmail);
router.post("/forgot-password", validate(forgotPasswordSchema), forgotPassword);
router.post("/reset-password", validate(resetPasswordSchema), resetPassword);

export default router;
