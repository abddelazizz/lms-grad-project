import {
  Course,
  CourseSection,
  LessonContent,
  Enrollment,
  User,
  AssignmentSubmission,
  LessonProgress,
  Quiz
} from "../models/index.js";
import AppError from "../utils/AppError.js";
import { recalculateEnrollmentProgress } from "./enrollmentService.js";

export const createCourse = async (courseData, instructorId) => {
  const course = await Course.create({
    title: courseData.title,
    category_id: courseData.category_id || null,
    instructor_id: instructorId,
    status: "draft",
    price: 0.00,
  });
  return course;
};

export const getAllPublishedCourses = async (page, limit) => {
  const offset = (page - 1) * limit;

  const { count, rows: courses } = await Course.findAndCountAll({
    where: { status: "published" },
    include: [
      {
        model: User,
        as: "instructor",
        attributes: ["name", "picture"],
      },
      {
        model: CourseSection,
        as: "sections",
        attributes: ["section_id", "title"],
        include: [
          {
            model: LessonContent,
            as: "lessons",
            attributes: ["content_id", "title", "content_type"],
          },
        ],
      },
    ],
    limit,
    offset,
    distinct: true,
    order: [["created_at", "DESC"]],
  });

  return { courses, count };
};

export const getCoursesByInstructor = async (instructorId) => {
  const courses = await Course.findAll({
    where: { instructor_id: instructorId },
    include: [
      {
        model: CourseSection,
        as: "sections",
        attributes: ["section_id", "title"],
        include: [
          {
            model: LessonContent,
            as: "lessons",
            attributes: ["content_id", "title"],
          },
        ],
      },
    ],
    order: [["created_at", "DESC"]],
  });
  return courses.map(c => {
    const data = c.toJSON();
    const total_sections = data.sections?.length || 0;
    const total_lessons = data.sections?.reduce((acc, s) => acc + (s.lessons?.length || 0), 0) || 0;
    return {
      ...data,
      total_sections,
      total_lessons
    };
  });
};

export const getEnrolledCourses = async (studentId) => {
  const enrollments = await Enrollment.findAll({
    where: { 
      student_id: studentId, 
      status: ["active", "completed"] 
    },
    include: [
      {
        model: Course,
        as: "course",
        attributes: ["course_id", "title", "thumbnail_url", "level", "description"],
        include: [
          {
            model: User,
            as: "instructor",
            attributes: ["user_id", "name", "picture"],
          },
          {
            model: CourseSection,
            as: "sections",
            attributes: ["section_id", "title"],
            include: [
              {
                model: LessonContent,
                as: "lessons",
                attributes: ["content_id", "title"],
              },
            ],
          },
        ],
      },
    ],
    order: [["enrolled_at", "DESC"]],
  });

  // Self-healing: Recalculate progress for each enrollment to ensure dashboard is accurate
  for (const e of enrollments) {
    await recalculateEnrollmentProgress(e, e.course_id, studentId);
  }

  return enrollments.map((e) => {
    const courseData = e.course.toJSON();
    const total_sections = courseData.sections?.length || 0;
    const total_lessons = courseData.sections?.reduce((acc, s) => acc + (s.lessons?.length || 0), 0) || 0;
    return {
      ...courseData,
      enrollment_id: e.enrollment_id,
      status: e.status,
      progress_percentage: parseFloat(e.progress_percentage) || 0,
      enrolled_at: e.enrolled_at,
      total_sections,
      total_lessons
    };
  });
};

export const updateCourse = async (courseId, instructorId, role, updateData) => {
  const course = await Course.findByPk(courseId);

  if (!course) {
    throw new AppError("Course not found", 404);
  }

  if (role !== "admin" && course.instructor_id !== instructorId) {
    throw new AppError("You are not allowed to modify this course", 403);
  }

  // Filter out undefined values so we only update provided fields
  const cleanData = {};
  for (const [key, value] of Object.entries(updateData)) {
    if (value !== undefined) cleanData[key] = value;
  }

  await course.update(cleanData);
  return course;
};

export const publishCourse = async (courseId, instructorId, role) => {
  const course = await Course.findByPk(courseId, {
    include: [{ association: "sections", include: [{ association: "lessons" }] }],
  });

  if (!course) {
    throw new AppError("Course not found", 404);
  }

  if (role !== "admin" && course.instructor_id !== instructorId) {
    throw new AppError("You are not allowed to publish this course", 403);
  }

  // ─── Publishing Gate: validation checklist ───────────────────
  const missingRequirements = [];

  if (!course.description) {
    missingRequirements.push("Course description is required.");
  }
  if (!course.thumbnail_url) {
    missingRequirements.push("Course thumbnail is required.");
  }
  if (!course.sections || course.sections.length === 0) {
    missingRequirements.push("At least one section is required.");
  }

  const hasLesson = course.sections?.some((s) => s.lessons && s.lessons.length > 0);
  if (course.sections?.length > 0 && !hasLesson) {
    missingRequirements.push("At least one lesson is required within the sections.");
  }

  if (missingRequirements.length > 0) {
    throw new AppError(
      JSON.stringify({ missing: missingRequirements }),
      400
    );
  }

  await course.update({ status: "published" });
  return course;
};

export const softDeleteCourse = async (courseId, instructorId, role) => {
  const course = await Course.findByPk(courseId);

  if (!course) {
    throw new AppError("Course not found", 404);
  }

  if (role !== "admin" && course.instructor_id !== instructorId) {
    throw new AppError("You are not allowed to delete this course", 403);
  }

  await course.destroy();
};

export const getCourseDetails = async (courseId, userId = null, role = null) => {
  const course = await Course.findByPk(courseId, {
    include: [
      {
        model: User,
        as: "instructor",
        attributes: ["user_id", "name", "email", "picture"],
      },
      {
        model: CourseSection,
        as: "sections",
        include: [
          {
            model: LessonContent,
            as: "lessons",
            attributes: [
              "content_id",
              "parent_content_id",
              "title",
              "content_type",
              "duration",
              "is_free_preview",
              "position_order",
              "video_url",
              "file_url",
            ],
            include: [
              {
                model: AssignmentSubmission,
                as: "submissions",
                where: userId ? { student_id: userId } : { student_id: 0 },
                required: false,
              },
              {
                model: LessonProgress,
                as: "progress_records",
                where: userId ? { student_id: userId } : { student_id: 0 },
                required: false,
              },
            ],
          },
          {
            model: Quiz,
            as: "quizzes",
            attributes: ["quiz_id", "title", "num_questions", "duration", "status"],
          },
        ],
      },
    ],
  });

  if (!course) {
    throw new AppError("Course not found", 404);
  }

  // Enrollment check
  let isEnrolled = false;
  if (userId) {
    // Admin and the instructor of the course are always "enrolled"
    if (role === "admin" || course.instructor_id === userId) {
      isEnrolled = true;
    } else {
      const enrollment = await Enrollment.findOne({
        where: { student_id: userId, course_id: courseId },
      });
      isEnrolled = !!enrollment;
    }
  }

  // Convert to JSON and add extra fields
  const courseData = course.toJSON();
  courseData.isEnrolled = isEnrolled;

  courseData.sections = (courseData.sections || []).map((section) => ({
    ...section,
    lessons: (section.lessons || []).sort((a, b) => a.position_order - b.position_order),
  }));

  return courseData;
};
