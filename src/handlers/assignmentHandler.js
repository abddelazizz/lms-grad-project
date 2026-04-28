import catchAsync from "../utilis/catchAsync.js";
import AppError from "../utilis/AppError.js";
import { AssignmentSubmission } from "../models/index.js";

// POST /api/assignments/:contentId/upload
export const submitAssignment = catchAsync(async (req, res) => {
  const { contentId } = req.params;
  
  if (!req.file) {
    throw new AppError("Please provide an assignment file to upload.", 400);
  }

  // File is automatically uploaded to Cloudinary via uploadMiddleware. 
  // We extract the generated secure URL from req.file.path
  const fileUrl = req.file.path;

  // Insert submission record into database
  const submission = await AssignmentSubmission.create({
    content_id: contentId,
    student_id: req.user.user_id,
    file_url: fileUrl,
    status: "pending"
  });

  res.status(201).json({
    status: "success",
    message: "Assignment uploaded and submitted successfully.",
    data: { submission }
  });
});
