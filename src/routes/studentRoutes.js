import express from "express";
import { authenticate, uploadProfile, checkOwnership, validate } from "../middlewares/index.js";
import { getProfile, updateProfile, uploadProfilePicture } from "../handlers/index.js";
import { getStudentInbox } from "../handlers/assignmentHandler.js";
import { updateProfileSchema } from "../validations/index.js";

const router = express.Router();

// Profile Management
router.get("/profile", authenticate, getProfile);
router.patch("/profile", authenticate, validate(updateProfileSchema), updateProfile);
router.patch("/profile/photo", authenticate, uploadProfile, uploadProfilePicture);

// Legacy/ID-specific routes
router.patch("/:id/profile-picture", authenticate, checkOwnership, uploadProfile, uploadProfilePicture);

// GET /api/students/inbox/reviews — the student inbox feed
router.get("/inbox/reviews", authenticate, getStudentInbox);

export default router;

