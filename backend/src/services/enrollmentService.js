import Course from "../models/Course.js";
import CourseSection from "../models/CourseSection.js";
import Enrollment from "../models/Enrollment.js";
import LessonContent from "../models/LessonContent.js";
import LessonProgress from "../models/LessonProgress.js";
import Quiz from "../models/Quiz.js";
import QuizAttempt from "../models/QuizAttempt.js";
import AppError from "../utils/AppError.js";

/**
 * POST /api/courses/:courseId/enroll
 * Enrolls a student in a published course.
 */
export const enrollStudent = async (courseId, studentId) => {
  const course = await Course.findByPk(courseId);
  if (!course) {
    throw new AppError("Course not found", 404);
  }

  if (course.status !== "published") {
    throw new AppError("Cannot enroll in an unpublished course", 400);
  }

  // Check if already enrolled
  const existing = await Enrollment.findOne({
    where: { student_id: studentId, course_id: courseId },
  });
  if (existing) {
    if (existing.status === "dropped") {
      await existing.update({
        status: "active",
        enrolled_at: new Date(),
      });
      return existing;
    }
    throw new AppError("You are already enrolled in this course", 409);
  }

  const enrollment = await Enrollment.create({
    student_id: studentId,
    course_id: courseId,
  });

  return enrollment;
};

/**
 * GET /api/lessons/:lessonId/watch
 * Returns the video_url if the lesson is a free preview or the user is enrolled.
 */
export const accessLessonContent = async (lessonId, userId) => {
  const lesson = await LessonContent.findByPk(lessonId);
  if (!lesson) {
    throw new AppError("Lesson not found", 404);
  }

  // Free preview — anyone can see
  if (lesson.is_free_preview) {
    return {
      content_id: lesson.content_id,
      title: lesson.title,
      content_type: lesson.content_type,
      video_url: lesson.video_url,
      file_url: lesson.file_url,
    };
  }

  // Must be enrolled to see paid content
  // Find the course_id through the section
  const section = await CourseSection.findByPk(lesson.section_id);
  if (!section) {
    throw new AppError("Section not found", 404);
  }

  // Check if the user is the instructor/admin
  const course = await Course.findByPk(section.course_id);
  if (course && course.instructor_id === userId) {
    return {
      content_id: lesson.content_id,
      title: lesson.title,
      content_type: lesson.content_type,
      video_url: lesson.video_url,
      file_url: lesson.file_url,
    };
  }

  const enrollment = await Enrollment.findOne({
    where: { student_id: userId, course_id: section.course_id },
  });

  if (!enrollment) {
    throw new AppError("You must be enrolled to access this content", 403);
  }

  return {
    content_id: lesson.content_id,
    title: lesson.title,
    content_type: lesson.content_type,
    video_url: lesson.video_url,
    file_url: lesson.file_url,
  };
};

/**
 * PATCH /api/progress/lessons/:lessonId
 * Updates (or creates) LessonProgress. If completed, recalculates enrollment %.
 */
export const updateLessonProgress = async (lessonId, studentId, data) => {
  const lesson = await LessonContent.findByPk(lessonId);
  if (!lesson) {
    throw new AppError("Lesson not found", 404);
  }

  // Verify enrollment
  const section = await CourseSection.findByPk(lesson.section_id);
  if (!section) {
    throw new AppError("Section not found", 404);
  }

  const enrollment = await Enrollment.findOne({
    where: { student_id: studentId, course_id: section.course_id },
  });
  if (!enrollment) {
    throw new AppError("You must be enrolled to track progress", 403);
  }

  // Upsert: find existing or create new
  let [progress, created] = await LessonProgress.findOrCreate({
    where: { student_id: studentId, lesson_id: lessonId },
    defaults: {
      status: data.status,
      last_watched_at: data.last_watched_at,
      completed_at: data.status === "completed" ? new Date() : null,
    },
  });

  if (!created) {
    await progress.update({
      status: data.status,
      last_watched_at: data.last_watched_at,
      completed_at: data.status === "completed" ? new Date() : progress.completed_at,
    });
  }

  // If completed, recalculate the enrollment's progress_percentage
  if (data.status === "completed") {
    await recalculateEnrollmentProgress(enrollment, section.course_id, studentId);
  }

  return progress;
};

/**
 * Recalculates progress_percentage on the Enrollment record.
 * progress_percentage = (completed items / total items) * 100
 * Items include: Video Lessons, PDF Assignments, and Quizzes.
 */
export const recalculateEnrollmentProgress = async (enrollment, courseId, studentId) => {
  // 1. Get all sections for this course
  const sections = await CourseSection.findAll({
    where: { course_id: courseId },
    attributes: ["section_id"],
  });
  const sectionIds = sections.map((s) => s.section_id);

  if (sectionIds.length === 0) return;

  // 2. Count Total Trackable Items
  // Lessons (Videos + Assignments)
  const totalLessons = await LessonContent.count({
    where: { 
      section_id: sectionIds, 
      content_type: ["video", "pdf_assignment"] 
    },
  });

  // Quizzes
  const totalQuizzes = await Quiz.count({
    where: { section_id: sectionIds, status: "published" },
  });

  const totalItems = totalLessons + totalQuizzes;
  if (totalItems === 0) {
    await enrollment.update({ progress_percentage: 0 });
    return;
  }

  // 3. Count Completed Items
  // Completed Lessons (marked 'completed' in LessonProgress)
  const completedLessons = await LessonProgress.count({
    where: {
      student_id: studentId,
      lesson_id: (await LessonContent.findAll({
        where: { section_id: sectionIds, content_type: ["video", "pdf_assignment"] },
        attributes: ["content_id"],
      })).map((l) => l.content_id),
      status: "completed",
    },
  });

  // Completed Quizzes (at least one attempt exists)
  const completedQuizzes = await Quiz.count({
    distinct: true,
    include: [{
      model: QuizAttempt,
      as: 'attempts',
      where: { student_id: studentId },
      required: true
    }],
    where: { section_id: sectionIds }
  });

  const completedItems = completedLessons + completedQuizzes;
  const percentage = Math.min(((completedItems / totalItems) * 100), 100).toFixed(2);

  await enrollment.update({ progress_percentage: percentage });
};

/**
 * PATCH /api/enrollments/:id
 * Updates general enrollment data (e.g., status).
 */
export const updateEnrollment = async (enrollmentId, userId, data) => {
  const enrollment = await Enrollment.findByPk(enrollmentId);
  if (!enrollment) {
    throw new AppError("Enrollment not found", 404);
  }

  // Only the student themselves or an admin can update (cancel) the enrollment
  if (enrollment.student_id !== userId) {
    throw new AppError("You are not authorized to update this enrollment", 403);
  }

  await enrollment.update(data);
  return enrollment;
};
