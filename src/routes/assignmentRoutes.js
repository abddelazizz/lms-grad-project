import express from "express";
import { submitAssignment } from "../handlers/assignmentHandler.js";
import { uploadAssignment } from "../middlewares/uploadMiddleware.js";
import authenticate from "../middlewares/authMiddleware.js";

const router = express.Router();

// POST a new assignment file containing work for a specific content module
router.post("/:contentId/upload", authenticate, uploadAssignment, submitAssignment);

export default router;
