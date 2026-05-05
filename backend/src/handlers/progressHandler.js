import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/AppError.js";
import * as progressService from "../services/progressService.js";

/**
 * POST /api/students/progress/video
 * Body: { content_id, watched_seconds, completed }
 */
export const updateVideoProgress = catchAsync(async (req, res) => {
  const { content_id, watched_seconds, completed } = req.body;

  if (!content_id || watched_seconds === undefined) {
    throw new AppError("content_id and watched_seconds are required.", 400);
  }

  const record = await progressService.updateVideoProgress(
    req.user.user_id,
    content_id,
    watched_seconds,
    !!completed
  );

  res.status(200).json({
    status: "success",
    data: { progress: record },
  });
});

/**
 * GET /api/students/activity/courses/:courseId
 * Returns full activity for a student in a course.
 */
export const getStudentCourseActivity = catchAsync(async (req, res) => {
  const activity = await progressService.getStudentCourseActivity(
    req.user.user_id,
    req.params.courseId
  );

  res.status(200).json({
    status: "success",
    data: activity,
  });
});
