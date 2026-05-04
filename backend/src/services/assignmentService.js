import { v2 as cloudinary } from "cloudinary";
import { sequelize } from "../config/index.js";
import {
  AssignmentSubmission,
  Notification,
  LessonContent,
  CourseSection,
  Course,
  User,
  LessonProgress,
  Enrollment,
  Student,
} from "../models/index.js";
import AppError from "../utils/AppError.js";

// ─── Passing grade threshold ────────────────────────────────
const PASSING_GRADE = 50;

// ─────────────────────────────────────────────────────────────
//  API 1 — Student uploads an assignment (transactional)
// ─────────────────────────────────────────────────────────────
/**
 * Handles submission with smart resubmission logic:
 *  - If an existing row is "pending" → overwrite the file URL (student fix).
 *  - If an existing row is "graded" with a failing grade → create a new row.
 *  - Otherwise → create a new row.
 */
export const submitAssignment = async (contentId, studentId, fileUrl) => {
  // 1. Verify contentId exists and is an assignment
  const lesson = await LessonContent.findByPk(contentId);
  if (!lesson) {
    throw new AppError("Lesson content not found.", 404);
  }
  if (lesson.content_type !== "pdf_assignment") {
    throw new AppError("This lesson is not an assignment.", 400);
  }

  // 2. Open a SQL Transaction
  const t = await sequelize.transaction();

  try {
    let submission;

    // 3. Resubmission logic
    const existing = await AssignmentSubmission.findOne({
      where: { content_id: contentId, student_id: studentId },
      order: [["submitted_at", "DESC"]],
      transaction: t,
    });

    if (existing && existing.status === "pending") {
      // Overwrite the file link on the pending row
      await existing.update({ file_url: fileUrl, submitted_at: new Date() }, { transaction: t });
      submission = existing;
    } else if (existing && existing.status === "graded" && existing.grade < PASSING_GRADE) {
      // Failed grade — allow a new row (version history)
      submission = await AssignmentSubmission.create(
        { content_id: contentId, student_id: studentId, file_url: fileUrl, status: "resubmit" },
        { transaction: t }
      );
    } else {
      // No existing or previously passed — create fresh
      submission = await AssignmentSubmission.create(
        { content_id: contentId, student_id: studentId, file_url: fileUrl, status: "pending" },
        { transaction: t }
      );
    }

    // 4. Lookup the instructor who owns the course
    const section = await CourseSection.findByPk(lesson.section_id, { transaction: t });
    if (!section) throw new AppError("Section not found for this lesson.", 404);

    const course = await Course.findByPk(section.course_id, { transaction: t });
    if (!course) throw new AppError("Course not found for this section.", 404);

    // 5. Create notification for the instructor
    await Notification.create(
      {
        user_id: course.instructor_id,
        type: "new_submission",
        reference_id: submission.submission_id,
      },
      { transaction: t }
    );

    // 6. Commit
    await t.commit();
    return submission;
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

// ─────────────────────────────────────────────────────────────
//  API 2 — Instructor inbox: all submission notifications
// ─────────────────────────────────────────────────────────────
export const getInstructorInbox = async (instructorId) => {
  const notifications = await Notification.findAll({
    where: { user_id: instructorId, type: "new_submission" },
    order: [["created_at", "DESC"]],
    include: [
      {
        model: AssignmentSubmission,
        as: "submission",
        attributes: ["submission_id", "file_url", "status", "grade", "feedback", "submitted_at"],
        include: [
          {
            model: User,
            as: "student",
            attributes: ["user_id", "name", "email", "picture"],
          },
          {
            model: LessonContent,
            as: "lessonContent",
            attributes: ["content_id", "title", "content_type"],
          },
        ],
      },
    ],
  });

  return notifications;
};

// ─────────────────────────────────────────────────────────────
//  API 3 — Instructor reviews a submission (transactional)
// ─────────────────────────────────────────────────────────────
export const reviewSubmission = async (submissionId, instructorId, { grade, feedback }) => {
  // ═══════════════════════════════════════════════════════════
  //  Phase 1 — State Retrieval & Validation (Pre-Flight Check)
  // ═══════════════════════════════════════════════════════════

  // 1a. Fetch the submission and verify ownership chain
  const submission = await AssignmentSubmission.findByPk(submissionId, {
    include: [
      {
        model: LessonContent,
        as: "lessonContent",
        include: [
          {
            model: CourseSection,
            as: "CourseSection",
            include: [{ model: Course, as: "Course" }],
          },
        ],
      },
    ],
  });

  if (!submission) {
    throw new AppError("Submission not found.", 404);
  }

  // Security Gate: verify the instructor owns the course
  const course = submission.lessonContent?.CourseSection?.Course;
  if (!course || course.instructor_id !== instructorId) {
    throw new AppError("You do not own the course this submission belongs to.", 403);
  }

  // 1b. Extract the baseline grade
  //   - If "pending" (never graded) → baseline is 0
  //   - If already "graded"         → baseline is the stored grade
  const baselineGrade = submission.status === "pending" ? 0 : (submission.grade || 0);

  // ═══════════════════════════════════════════════════════════
  //  Phase 2 — Idempotent Delta Calculation
  // ═══════════════════════════════════════════════════════════
  const delta = grade - baselineGrade;

  // ═══════════════════════════════════════════════════════════
  //  Phase 3 — Atomic Transaction (Ledger Update)
  // ═══════════════════════════════════════════════════════════
  const t = await sequelize.transaction();

  try {
    // Write 1: Update the submission record
    await submission.update(
      { grade, feedback, status: "graded" },
      { transaction: t }
    );

    // Write 2: Increment the student's total_points by the delta.
    //   We use sequelize.literal() so the DB engine performs the math
    //   (total_points = total_points + delta) instead of a read-modify-write
    //   in Node.js. This prevents race conditions if two instructors grade
    //   two different assignments for the same student simultaneously.
    await Student.update(
      { total_points: sequelize.literal(`total_points + ${parseInt(delta, 10)}`) },
      { where: { user_id: submission.student_id }, transaction: t }
    );

    // ═════════════════════════════════════════════════════════
    //  Phase 4 — Side Effects & Commit
    // ═════════════════════════════════════════════════════════

    // Side Effect 1: Notification — alert the student
    await Notification.create(
      {
        user_id: submission.student_id,
        type: "new_review",
        reference_id: submission.submission_id,
      },
      { transaction: t }
    );

    // Side Effect 2: Progress — passing grade marks lesson completed
    if (grade >= PASSING_GRADE) {
      const [progress, created] = await LessonProgress.findOrCreate({
        where: {
          student_id: submission.student_id,
          lesson_id: submission.content_id,
        },
        defaults: {
          status: "completed",
          completed_at: new Date(),
        },
        transaction: t,
      });

      if (!created && progress.status !== "completed") {
        await progress.update(
          { status: "completed", completed_at: new Date() },
          { transaction: t }
        );
      }

      // Recalculate enrollment progress percentage
      await recalculateEnrollmentProgress(
        submission.student_id,
        course.course_id,
        t
      );
    }

    // Commit — the ledger is now permanent
    await t.commit();

    // Return the updated submission
    return submission.reload();
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

// ─────────────────────────────────────────────────────────────
//  API 4 — Student inbox: all review notifications
// ─────────────────────────────────────────────────────────────
export const getStudentInbox = async (studentId) => {
  const notifications = await Notification.findAll({
    where: { user_id: studentId, type: "new_review" },
    order: [["created_at", "DESC"]],
    include: [
      {
        model: AssignmentSubmission,
        as: "submission",
        attributes: ["submission_id", "file_url", "status", "grade", "feedback", "submitted_at"],
        include: [
          {
            model: LessonContent,
            as: "lessonContent",
            attributes: ["content_id", "title", "content_type"],
          },
        ],
      },
    ],
  });

  return notifications;
};

// ─────────────────────────────────────────────────────────────
//  Orphaned File Cleanup — delete Cloudinary asset on removal
// ─────────────────────────────────────────────────────────────
export const deleteSubmission = async (submissionId, instructorId) => {
  const submission = await AssignmentSubmission.findByPk(submissionId, {
    include: [
      {
        model: LessonContent,
        as: "lessonContent",
        include: [
          {
            model: CourseSection,
            as: "CourseSection",
            include: [{ model: Course, as: "Course" }],
          },
        ],
      },
    ],
  });

  if (!submission) {
    throw new AppError("Submission not found.", 404);
  }

  const course = submission.lessonContent?.CourseSection?.Course;
  if (!course || course.instructor_id !== instructorId) {
    throw new AppError("You do not own the course this submission belongs to.", 403);
  }

  // Destroy the Cloudinary file to prevent orphaned storage
  if (submission.file_url) {
    try {
      // Extract public ID from Cloudinary URL
      const urlParts = submission.file_url.split("/");
      const folderAndFile = urlParts.slice(-2).join("/"); // e.g. "recode_academy_assignments/abc123"
      const publicId = folderAndFile.replace(/\.[^/.]+$/, ""); // strip extension
      await cloudinary.uploader.destroy(publicId, { resource_type: "raw" });
    } catch (err) {
      // Log but don't block — the DB row should still be removed
      console.error("Cloudinary cleanup failed:", err.message);
    }
  }

  // Remove associated notifications first, then the submission
  await Notification.destroy({ where: { reference_id: submissionId } });
  await submission.destroy();

  return { message: "Submission and associated file deleted successfully." };
};

// ─────────────────────────────────────────────────────────────
//  Helper — recalculate enrollment progress percentage
// ─────────────────────────────────────────────────────────────
const recalculateEnrollmentProgress = async (studentId, courseId, transaction) => {
  const enrollment = await Enrollment.findOne({
    where: { student_id: studentId, course_id: courseId },
    transaction,
  });

  if (!enrollment) return;

  const sections = await CourseSection.findAll({
    where: { course_id: courseId },
    attributes: ["section_id"],
    transaction,
  });
  const sectionIds = sections.map((s) => s.section_id);
  if (sectionIds.length === 0) return;

  const totalLessons = await LessonContent.count({
    where: { section_id: sectionIds },
    transaction,
  });
  if (totalLessons === 0) return;

  const lessonIds = (
    await LessonContent.findAll({
      where: { section_id: sectionIds },
      attributes: ["content_id"],
      transaction,
    })
  ).map((l) => l.content_id);

  const completedLessons = await LessonProgress.count({
    where: {
      student_id: studentId,
      lesson_id: lessonIds,
      status: "completed",
    },
    transaction,
  });

  const percentage = ((completedLessons / totalLessons) * 100).toFixed(2);
  await enrollment.update({ progress_percentage: percentage }, { transaction });
};
