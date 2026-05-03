import { v2 as cloudinary } from "cloudinary";
import { Op } from "sequelize";
import Course from "../models/Course.js";
import LessonContent from "../models/LessonContent.js";
import AppError from "../utilis/AppError.js";
import { verifyCourseOwnership, verifySectionOwnership } from "./sectionService.js";

/**
 * PATCH /api/courses/:courseId/thumbnail
 * Uploads image to Cloudinary. If cloudinary_thumbnail_id already exists,
 * deletes the old image first. Saves new thumbnail_url + cloudinary_thumbnail_id.
 */
export const uploadThumbnail = async (courseId, instructorId, role, file) => {
  const course = await verifyCourseOwnership(courseId, instructorId, role);

  // Delete old thumbnail from Cloudinary if one exists
  if (course.cloudinary_thumbnail_id) {
    try {
      await cloudinary.uploader.destroy(course.cloudinary_thumbnail_id);
    } catch (err) {
      console.error("Failed to delete old thumbnail from Cloudinary:", err.message);
    }
  }

  // file.path = Cloudinary secure_url, file.filename = public_id
  await course.update({
    thumbnail_url: file.path,
    cloudinary_thumbnail_id: file.filename,
  });

  return course;
};

/**
 * POST /api/sections/:sectionId/lessons  (Unified)
 *
 * Accepts a single file via multipart/form-data (field name: "lesson_file").
 * The controller reads `content_type` from req.body to decide which DB column
 * receives the Cloudinary URL:
 *   - "video"          → video_url
 *   - "pdf_lecture"     → file_url
 *   - "pdf_assignment"  → file_url
 */
export const createUnifiedLesson = async (sectionId, instructorId, role, file, data) => {
  await verifySectionOwnership(sectionId, instructorId, role);

  const { title, content_type, is_free_preview, parent_content_id } = data;

  // Validate content_type
  const validTypes = ["video", "pdf_lecture", "pdf_assignment"];
  if (!validTypes.includes(content_type)) {
    throw new AppError(
      `Invalid content_type. Must be one of: ${validTypes.join(", ")}`,
      400
    );
  }

  let normalizedParentId = null;
  if (parent_content_id !== null && parent_content_id !== undefined && parent_content_id !== "") {
    normalizedParentId = Number(parent_content_id);

    if (!Number.isInteger(normalizedParentId) || normalizedParentId <= 0) {
      throw new AppError("parent_content_id must be a valid positive integer.", 400);
    }

    const parentLesson = await LessonContent.findOne({
      where: {
        content_id: normalizedParentId,
        section_id: sectionId,
      },
    });

    if (!parentLesson) {
      throw new AppError("Parent lesson not found in this section.", 404);
    }

    if (parentLesson.content_type !== "video") {
      throw new AppError("Only video lessons can be used as parent lessons.", 400);
    }

    if (parentLesson.parent_content_id) {
      throw new AppError("Nested lesson attachments are not allowed.", 400);
    }

    if (content_type === "video") {
      throw new AppError("A child lesson cannot use content_type video.", 400);
    }
  }

  // Auto-calculate position_order
  const existingCount = await LessonContent.count({ where: { section_id: sectionId } });

  // Map Cloudinary URL to the correct column based on content_type
  const lessonData = {
    section_id: sectionId,
    parent_content_id: normalizedParentId,
    title,
    content_type,
    is_free_preview: is_free_preview || false,
    cloudinary_public_id: file.filename,
    position_order: existingCount + 1,
  };

  if (content_type === "video") {
    lessonData.video_url = file.path;
    lessonData.duration = Math.round(file.duration || 0);
  } else {
    // pdf_lecture or pdf_assignment → store in file_url
    lessonData.file_url = file.path;
  }

  const lesson = await LessonContent.create(lessonData);
  return lesson;
};

const deleteCloudinaryAsset = async (lesson) => {
  if (!lesson?.cloudinary_public_id) {
    return;
  }

  const resourceType = lesson.content_type === "video" ? "video" : "raw";

  try {
    await cloudinary.uploader.destroy(lesson.cloudinary_public_id, { resource_type: resourceType });
  } catch (err) {
    console.error("Failed to delete file from Cloudinary:", err.message);
  }
};

/**
 * DELETE /api/lessons/:lessonId
 * Soft-deletes the LessonContent record.
 * Triggers async Cloudinary file deletion using cloudinary_public_id.
 */
export const deleteLesson = async (lessonId, instructorId, role) => {
  const lesson = await LessonContent.findByPk(lessonId);
  if (!lesson) {
    throw new AppError("Lesson not found", 404);
  }

  // Verify ownership through the section → course chain
  await verifySectionOwnership(lesson.section_id, instructorId, role);

  const childLessons = await LessonContent.findAll({
    where: { parent_content_id: lesson.content_id },
  });

  const affectedLessons = [...childLessons, lesson];

  await LessonContent.destroy({
    where: {
      [Op.or]: [
        { content_id: lesson.content_id },
        { parent_content_id: lesson.content_id },
      ],
    },
  });

  await Promise.all(affectedLessons.map((affectedLesson) => deleteCloudinaryAsset(affectedLesson)));

  return { message: "Lesson deleted successfully" };
};
