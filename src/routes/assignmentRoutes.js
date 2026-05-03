import express from "express";
import { submitAssignment, reviewSubmission, deleteSubmission } from "../handlers/assignmentHandler.js";
import { uploadAssignment } from "../middlewares/uploadMiddleware.js";
import authenticate from "../middlewares/authMiddleware.js";
import restrictTo from "../middlewares/restrictTo.js";

const router = express.Router();

// ─── Student: upload assignment ─────────────────────────────
// POST /api/assignments/:contentId/upload
router.post(
  "/:contentId/upload",
  authenticate,
  restrictTo("student"),
  uploadAssignment,
  submitAssignment
);

// ─── Instructor: review a submission ────────────────────────
// PATCH /api/assignments/submissions/:submissionId/review
router.patch(
  "/submissions/:submissionId/review",
  authenticate,
  restrictTo("instructor", "admin"),
  reviewSubmission
);

// ─── Instructor: delete a submission (with Cloudinary cleanup)
// DELETE /api/assignments/submissions/:submissionId
router.delete(
  "/submissions/:submissionId",
  authenticate,
  restrictTo("instructor", "admin"),
  deleteSubmission
);

export default router;
