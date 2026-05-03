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
import Quiz from "./Quiz.js";
import QuizAttempt from "./QuizAttempt.js";
import AssignmentSubmission from "./AssignmentSubmission.js";
import Notification from "./Notification.js";
import Conversation from "./Conversation.js";
import ChatMessage from "./ChatMessage.js";
import AuditLog from "./AuditLog.js";

// ─── Course Hierarchy ────────────────────────────────────────
// User (instructor) → Course → Section → Lesson
User.hasMany(Course, { foreignKey: "instructor_id", as: "taught_courses" });
Course.belongsTo(User, { foreignKey: "instructor_id", as: "instructor" });

Course.hasMany(CourseSection, { foreignKey: "course_id", as: "sections", onDelete: "CASCADE" });
CourseSection.belongsTo(Course, { foreignKey: "course_id" });

CourseSection.hasMany(LessonContent, { foreignKey: "section_id", as: "lessons", onDelete: "CASCADE" });
LessonContent.belongsTo(CourseSection, { foreignKey: "section_id" });
LessonContent.hasMany(LessonContent, {
  foreignKey: "parent_content_id",
  as: "attachments",
  onDelete: "CASCADE",
});
LessonContent.belongsTo(LessonContent, {
  foreignKey: "parent_content_id",
  as: "parentLesson",
});

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

// ─── Direct Profiles ─────────────────────────────────────────
User.hasOne(Student, { foreignKey: "user_id", as: "studentProfile" });
Student.belongsTo(User, { foreignKey: "user_id", as: "user" });

User.hasOne(Instructor, { foreignKey: "user_id", as: "instructorProfile" });
Instructor.belongsTo(User, { foreignKey: "user_id", as: "user" });

// ─── Assignment Submissions ─────────────────────────────────
// Submission belongs to a Student (User) and a LessonContent
AssignmentSubmission.belongsTo(User, { foreignKey: "student_id", as: "student" });
AssignmentSubmission.belongsTo(LessonContent, { foreignKey: "content_id", as: "lessonContent" });
User.hasMany(AssignmentSubmission, { foreignKey: "student_id", as: "submissions" });
LessonContent.hasMany(AssignmentSubmission, { foreignKey: "content_id", as: "submissions" });

// ─── Notifications (Inbox Engine) ────────────────────────────
// Notification belongs to a recipient (User) and references a Submission
Notification.belongsTo(User, { foreignKey: "user_id", as: "recipient" });
Notification.belongsTo(AssignmentSubmission, { foreignKey: "reference_id", as: "submission" });
User.hasMany(Notification, { foreignKey: "user_id", as: "notifications" });
AssignmentSubmission.hasMany(Notification, { foreignKey: "reference_id", as: "notifications" });

// ─── Chat (Conversation-based) ──────────────────────────────
Conversation.hasMany(ChatMessage, { foreignKey: "conversation_id", as: "messages", onDelete: "CASCADE" });
ChatMessage.belongsTo(Conversation, { foreignKey: "conversation_id", as: "conversation" });

Conversation.belongsTo(Student, { foreignKey: "student_id", as: "student" });
Conversation.belongsTo(Instructor, { foreignKey: "instructor_id", as: "instructor" });
Student.hasMany(Conversation, { foreignKey: "student_id", as: "conversations" });
Instructor.hasMany(Conversation, { foreignKey: "instructor_id", as: "conversations" });

ChatMessage.belongsTo(User, { foreignKey: "sender_id", as: "sender" });
User.hasMany(ChatMessage, { foreignKey: "sender_id", as: "sentMessages" });

// ─── Quiz ──────────────────────────────────────────────────────
CourseSection.hasMany(Quiz, { foreignKey: "section_id", as: "quizzes" });
Quiz.belongsTo(CourseSection, { foreignKey: "section_id", as: "section" });

Quiz.hasMany(QuizAttempt, { foreignKey: "quiz_id", as: "attempts" });
QuizAttempt.belongsTo(Quiz, { foreignKey: "quiz_id", as: "quiz" });

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
  Quiz,
  QuizAttempt,
  AssignmentSubmission,
  Notification,
  Conversation,
  ChatMessage,
  AuditLog,
};