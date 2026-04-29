import catchAsync from "../utilis/catchAsync.js";
import AppError from "../utilis/AppError.js";
import * as assignmentService from "../services/assignmentService.js";

// ─── API 1: Student Upload ──────────────────────────────────
// POST /api/assignments/:contentId/upload
export const submitAssignment = catchAsync(async (req, res) => {
  const { contentId } = req.params;

  if (!req.file) {
    throw new AppError("Please provide an assignment file to upload.", 400);
  }

  // File is automatically uploaded to Cloudinary via uploadMiddleware.
  // We extract the generated secure URL from req.file.path
  const fileUrl = req.file.path;

  const submission = await assignmentService.submitAssignment(
    contentId,
    req.user.user_id,
    fileUrl
  );

  res.status(201).json({
    status: "success",
    message: "Assignment uploaded and submitted successfully.",
    data: { submission },
  });
});

// ─── API 2: Instructor Inbox ────────────────────────────────
// GET /api/instructor/inbox/assignments
export const getInstructorInbox = catchAsync(async (req, res) => {
  const notifications = await assignmentService.getInstructorInbox(
    req.user.user_id
  );

  res.status(200).json({
    status: "success",
    results: notifications.length,
    data: { notifications },
  });
});

// ─── API 3: Instructor Review ───────────────────────────────
// PATCH /api/assignments/submissions/:submissionId/review
export const reviewSubmission = catchAsync(async (req, res) => {
  const { submissionId } = req.params;
  const { grade, feedback } = req.body;

  if (grade === undefined || grade === null) {
    throw new AppError("Grade is required.", 400);
  }

  const submission = await assignmentService.reviewSubmission(
    parseInt(submissionId, 10),
    req.user.user_id,
    { grade, feedback }
  );

  res.status(200).json({
    status: "success",
    message: "Submission reviewed successfully.",
    data: { submission },
  });
});

// ─── API 4: Student Inbox ───────────────────────────────────
// GET /api/student/inbox/reviews
export const getStudentInbox = catchAsync(async (req, res) => {
  const notifications = await assignmentService.getStudentInbox(
    req.user.user_id
  );

  res.status(200).json({
    status: "success",
    results: notifications.length,
    data: { notifications },
  });
});

// ─── DELETE: Remove submission + Cloudinary cleanup ─────────
// DELETE /api/assignments/submissions/:submissionId
export const deleteSubmission = catchAsync(async (req, res) => {
  const result = await assignmentService.deleteSubmission(
    parseInt(req.params.submissionId, 10),
    req.user.user_id
  );

  res.status(200).json({
    status: "success",
    message: result.message,
  });
});
