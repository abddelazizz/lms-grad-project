export { checkHandler } from "./testHandler.js";
export { signup, login, verifyEmail, forgotPassword, verifyResetOTP, resetPassword, resendVerification, googleAuthCallback } from "./authHandler.js";
export { getProfile, updateProfile, uploadProfilePicture } from "./studentHandler.js";
export { createCourse, getAllCourses, getMyCourses, updateCourse, deleteCourse, publishCourse } from "./courseHandler.js";
export { createInstructor, getAllInstructors, getInstructorById, removeInstructor, createStudent, getAllStudents, getStudentById, removeStudent, getAdminDashboardStats } from "./adminHandler.js";
export { getDashboardStats, getCourseDetails } from "./instructorHandler.js";