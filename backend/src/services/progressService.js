import { VideoProgress, LessonProgress, LessonContent, CourseSection, Enrollment } from "../models/index.js";
import AppError from "../utils/AppError.js";

/**
 * Upsert video watch progress for a student.
 * Called periodically from the frontend while a student watches a video.
 */
export const updateVideoProgress = async (studentId, contentId, watchedSeconds, completed = false) => {
  const lesson = await LessonContent.findByPk(contentId);
  if (!lesson) {
    throw new AppError("Lesson content not found.", 404);
  }

  // Verify the student is enrolled in the course that owns this lesson
  const section = await CourseSection.findByPk(lesson.section_id);
  if (!section) throw new AppError("Section not found.", 404);

  const enrollment = await Enrollment.findOne({
    where: { student_id: studentId, course_id: section.course_id },
  });
  if (!enrollment) {
    throw new AppError("You must be enrolled to track progress.", 403);
  }

  const [record, created] = await VideoProgress.findOrCreate({
    where: { student_id: studentId, content_id: contentId },
    defaults: {
      watched_seconds: watchedSeconds,
      completed,
      last_accessed_at: new Date(),
    },
  });

  if (!created) {
    // Only update if new position is further ahead (or if completing)
    const updates = { last_accessed_at: new Date() };
    if (watchedSeconds > record.watched_seconds) {
      updates.watched_seconds = watchedSeconds;
    }
    if (completed && !record.completed) {
      updates.completed = true;
    }
    await record.update(updates);
  }

  return record;
};

/**
 * Get a student's full activity summary for a specific course.
 * Returns lesson progress + video progress for every lesson in the course.
 */
export const getStudentCourseActivity = async (studentId, courseId) => {
  // Verify enrollment
  const enrollment = await Enrollment.findOne({
    where: { student_id: studentId, course_id: courseId },
  });
  if (!enrollment) {
    throw new AppError("You are not enrolled in this course.", 403);
  }

  // Get all sections → lessons for this course
  const sections = await CourseSection.findAll({
    where: { course_id: courseId },
    attributes: ["section_id", "title", "order_index"],
    include: [
      {
        model: LessonContent,
        as: "lessons",
        attributes: ["content_id", "title", "content_type", "duration", "position_order"],
        include: [
          {
            model: LessonProgress,
            as: "progress_records",
            where: { student_id: studentId },
            required: false,
            attributes: ["status", "last_watched_at", "completed_at"],
          },
        ],
      },
    ],
    order: [
      ["order_index", "ASC"],
      [{ model: LessonContent, as: "lessons" }, "position_order", "ASC"],
    ],
  });

  // Also fetch video progress for all lessons
  const allLessonIds = sections.flatMap((s) =>
    s.lessons.map((l) => l.content_id)
  );

  const videoRecords = await VideoProgress.findAll({
    where: {
      student_id: studentId,
      content_id: allLessonIds,
    },
  });

  const videoMap = {};
  videoRecords.forEach((v) => {
    videoMap[v.content_id] = {
      watched_seconds: v.watched_seconds,
      completed: v.completed,
      last_accessed_at: v.last_accessed_at,
    };
  });

  // Shape response
  const activity = sections.map((section) => ({
    section_id: section.section_id,
    title: section.title,
    lessons: section.lessons.map((lesson) => {
      const progress = lesson.progress_records?.[0] || null;
      return {
        content_id: lesson.content_id,
        title: lesson.title,
        content_type: lesson.content_type,
        duration: lesson.duration,
        lesson_status: progress ? progress.status : "not_started",
        completed_at: progress?.completed_at || null,
        video_progress: videoMap[lesson.content_id] || null,
      };
    }),
  }));

  // Calculate overall stats
  const totalLessons = allLessonIds.length;
  const completedLessons = sections.reduce(
    (sum, s) =>
      sum +
      s.lessons.filter(
        (l) => l.progress_records?.[0]?.status === "completed"
      ).length,
    0
  );

  return {
    course_id: courseId,
    enrollment_status: enrollment.status,
    progress_percentage: enrollment.progress_percentage,
    total_lessons: totalLessons,
    completed_lessons: completedLessons,
    sections: activity,
  };
};
