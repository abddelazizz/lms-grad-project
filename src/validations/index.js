export {
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  resendVerificationSchema,
  createCourseSchema,
  updateCourseSchema,
  createInstructorSchema as createInstructorCourseSchema,
} from "./authValidation.js";

export {
  createInstructorSchema,
  createStudentSchema,
  paginationSchema,
} from "./adminValidators.js";
