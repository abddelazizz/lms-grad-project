import express from "express";
import { submitContactForm } from "../handlers/contactHandler.js";
import { globalLimiter } from "../middlewares/rateLimiter.js";

const router = express.Router();

// Apply global rate limiter to prevent spamming the contact form
router.post("/", globalLimiter, submitContactForm);

export default router;
