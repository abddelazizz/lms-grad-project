import express from "express";
import { requireAuth, uploadProfile, checkOwnership } from "../middlewares/index.js";
import { uploadProfilePicture } from "../handlers/index.js";

const router = express.Router();

// PATCH /api/students/:id/profile-picture
router.patch("/:id/profile-picture", requireAuth, checkOwnership, uploadProfile, uploadProfilePicture);

export default router;
