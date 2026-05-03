import * as lessonService from "../services/lessonService.js";
import AppError from "../utilis/AppError.js";
import catchAsync from "../utilis/catchAsync.js";

// PATCH /api/courses/:courseId/thumbnail — upload course thumbnail
export const uploadThumbnail = catchAsync(async (req, res) => {
  if (!req.file) {
    throw new AppError("No image file provided.", 400);
  }

  const course = await lessonService.uploadThumbnail(
    req.params.courseId,
    req.user.user_id,
    req.user.role,
    req.file
  );

  res.status(200).json({
    status: "success",
    message: "Thumbnail uploaded successfully",
    data: {
      thumbnail_url: course.thumbnail_url,
      cloudinary_thumbnail_id: course.cloudinary_thumbnail_id,
    },
  });
});

// POST /api/sections/:sectionId/lessons — unified lesson upload
export const createUnifiedLesson = catchAsync(async (req, res) => {
  if (!req.file) {
    throw new AppError("No lesson file provided.", 400);
  }

  const lesson = await lessonService.createUnifiedLesson(
    req.params.sectionId,
    req.user.user_id,
    req.user.role,
    req.file,
    {
      title: req.body.title,
      content_type: req.body.content_type,
      is_free_preview: req.body.is_free_preview,
      parent_content_id: req.body.parent_content_id || null,
    }
  );

  res.status(201).json({ status: "success", data: { lesson } });
});

// DELETE /api/lessons/:lessonId — soft-delete a lesson
export const deleteLesson = catchAsync(async (req, res) => {
  await lessonService.deleteLesson(
    req.params.lessonId,
    req.user.user_id,
    req.user.role
  );

  res.status(204).json({ status: "success", data: null });
});
