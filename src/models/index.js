// ============================================================
//  Central model registry & Sequelize association definitions
// ============================================================
import User from "./user.js";
import Course from "./Course.js";
import CourseSection from "./CourseSection.js";
import LessonContent from "./LessonContent.js";
import Enrollment from "./Enrollment.js";
import LessonProgress from "./LessonProgress.js";
import Review from "./Review.js";
import Instructor from "./Instructor.js";
import Student from "./Student.js";

// ─── Course Hierarchy ────────────────────────────────────────
// User (instructor) → Course → Section → Lesson
User.hasMany(Course, { foreignKey: "instructor_id", as: "taught_courses" });
Course.belongsTo(User, { foreignKey: "instructor_id", as: "instructor" });

Course.hasMany(CourseSection, { foreignKey: "course_id", as: "sections", onDelete: "CASCADE" });
CourseSection.belongsTo(Course, { foreignKey: "course_id" });

CourseSection.hasMany(LessonContent, { foreignKey: "section_id", as: "lessons", onDelete: "CASCADE" });
LessonContent.belongsTo(CourseSection, { foreignKey: "section_id" });

// ─── Enrollments ─────────────────────────────────────────────
// User (student) ←M:N→ Course  (junction: Enrollment)
User.hasMany(Enrollment, { foreignKey: "student_id", as: "enrollments" });
Enrollment.belongsTo(User, { foreignKey: "student_id", as: "student" });

Course.hasMany(Enrollment, { foreignKey: "course_id", as: "enrollments" });
Enrollment.belongsTo(Course, { foreignKey: "course_id", as: "course" });

// ─── Lesson Progress ─────────────────────────────────────────
// User (student) tracks progress per LessonContent
User.hasMany(LessonProgress, { foreignKey: "student_id", as: "lesson_progress" });
LessonProgress.belongsTo(User, { foreignKey: "student_id", as: "student" });

LessonContent.hasMany(LessonProgress, { foreignKey: "lesson_id", as: "progress_records" });
LessonProgress.belongsTo(LessonContent, { foreignKey: "lesson_id", as: "lesson" });

// ─── Reviews ─────────────────────────────────────────────────
// User (student) reviews a Course (one per course per student)
User.hasMany(Review, { foreignKey: "student_id", as: "reviews" });
Review.belongsTo(User, { foreignKey: "student_id", as: "student" });

Course.hasMany(Review, { foreignKey: "course_id", as: "reviews" });
Review.belongsTo(Course, { foreignKey: "course_id", as: "course" });

// ─── Exports ─────────────────────────────────────────────────
export {
  User,
  Course,
  CourseSection,
  LessonContent,
  Enrollment,
  LessonProgress,
  Review,
  Instructor,
  Student,
};
