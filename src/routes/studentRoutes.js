import express from "express";
import { authenticate, uploadProfile, checkOwnership } from "../middlewares/index.js";
import { getProfile, updateProfile, uploadProfilePicture } from "../handlers/index.js";

const router = express.Router();

// Profile Management
router.get("/profile", authenticate, getProfile);
router.patch("/profile", authenticate, updateProfile);
router.patch("/profile/photo", authenticate, uploadProfile, uploadProfilePicture);

// Legacy/ID-specific routes
router.patch("/:id/profile-picture", authenticate, checkOwnership, uploadProfile, uploadProfilePicture);

export default router;
