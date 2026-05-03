export {
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  resendVerificationSchema,
  verifyOtpSchema,
  createCourseSchema,
  updateCourseSchema,
  createInstructorSchema as createInstructorCourseSchema,
  updateProfileSchema,
} from "./authValidation.js";

export {
  createInstructorSchema,
  createStudentSchema,
  paginationSchema,
} from "./adminValidators.js";

export {
  createSectionSchema,
  createLessonSchema,
  updateProgressSchema,
} from "./courseValidation.js";

export {
  createConversationSchema,
  sendMessageSchema,
  markReadSchema,
  paginationQuerySchema,
} from "./chatValidation.js";

export {
  generateQuizSchema,
  saveQuizSchema,
} from "./quizValidation.js";
