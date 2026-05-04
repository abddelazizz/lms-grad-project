import * as enrollmentService from "../services/enrollmentService.js";
import catchAsync from "../utils/catchAsync.js";

// POST /api/courses/:courseId/enroll — enroll a student
export const enrollStudent = catchAsync(async (req, res) => {
  const enrollment = await enrollmentService.enrollStudent(
    req.params.courseId,
    req.user.user_id
  );

  res.status(201).json({ status: "success", data: { enrollment } });
});

// GET /api/lessons/:lessonId/watch — access lesson content
export const watchLesson = catchAsync(async (req, res) => {
  const content = await enrollmentService.accessLessonContent(
    req.params.lessonId,
    req.user.user_id
  );

  res.status(200).json({ status: "success", data: { content } });
});

// PATCH /api/progress/lessons/:lessonId — update lesson progress
export const updateProgress = catchAsync(async (req, res) => {
  const { last_watched_at, status } = req.body;

  const progress = await enrollmentService.updateLessonProgress(
    req.params.lessonId,
    req.user.user_id,
    { last_watched_at, status }
  );

  res.status(200).json({ status: "success", data: { progress } });
});
