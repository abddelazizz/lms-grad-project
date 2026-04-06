export { checkHandler } from "./testHandler.js";
export { signup, login, verifyEmail, forgotPassword, resetPassword, resendVerification, googleAuthCallback } from "./authHandler.js";
export { uploadProfilePicture } from "./studentHandler.js";
export { createCourse, getAllCourses, getMyCourses, updateCourse, deleteCourse, publishCourse } from "./courseHandler.js";
export { createInstructor } from "./adminHandler.js";
export { getDashboardStats, getCourseDetails } from "./instructorHandler.js";