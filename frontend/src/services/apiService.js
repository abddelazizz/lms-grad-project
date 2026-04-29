import axios from 'axios';

const BASE_URL = 'https://learn.evolvesight.com';
const API_BASE_URL = `${BASE_URL}/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor لإضافة الـ Token في كل طلب لو موجود
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const courseService = {
  getAllCourses: (page = 1, limit = 10) => api.get(`/courses?page=${page}&limit=${limit}`),
  getCourseDetails: (id) => api.get(`/courses/${id}`),
  getMyCourses: () => api.get('/courses/my-courses'),
  createCourse: (data) => api.post('/courses', data),
  updateCourse: (id, data) => api.patch(`/courses/${id}`, data),
  deleteCourse: (id) => api.delete(`/courses/${id}`),
  publishCourse: (id) => api.patch(`/courses/${id}/publish`),
  uploadCourseThumbnail: (id, formData) => api.patch(`/courses/${id}/thumbnail`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  signup: (userData) => api.post('/auth/signup', userData),          // was /auth/register — 404 fix
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  resendVerification: (email) => api.post('/auth/resend-verification', { email }),
  // verifyOTP removed — email verification is link-based (/auth/verify-email?token=...)
  // only the forgot-password OTP flow uses verifyResetOTP below
  verifyResetOTP: (data) => api.post('/auth/verify-reset-otp', data),
};

export const API_BASE = BASE_URL;

export const adminService = {
  getInstructors: () => api.get('/admin/instructors'),
  getInstructor: (id) => api.get(`/admin/instructors/${id}`),
  addInstructor: (data) => api.post('/admin/instructors', data),
  removeInstructor: (id) => api.delete(`/admin/instructors/${id}`),
  getStudents: () => api.get('/admin/students'),
  getStudent: (id) => api.get(`/admin/students/${id}`),
  addStudent: (data) => api.post('/admin/students', data),
  removeStudent: (id) => api.delete(`/admin/students/${id}`),
  getStats: () => api.get('/admin/dashboard/stats'),
};

export const studentService = {
  getProfile: () => api.get('/students/profile'),
  updateProfile: (data) => api.patch('/students/profile', data),
  updatePhoto: (formData) => api.patch('/students/profile/photo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  updateProfilePictureById: (id, formData) => api.patch(`/students/${id}/profile-picture`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

export const contactService = {
  submitForm: (data) => api.post('/contact', data),
};

export const instructorService = {
  getStats: () => api.get('/instructor/dashboard-stats'),
  getCourseDetails: (id) => api.get(`/instructor/courses/${id}/details`),
};

export const assignmentService = {
  // Now student sees their reviews in assignments list
  getAssignments: () => api.get('/students/inbox/reviews'), 
  uploadAssignment: (contentId, file) => {
    const formData = new FormData();
    formData.append("assignment_file", file);
    return api.post(`/assignments/${contentId}/upload`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  reviewSubmission: (submissionId, data) => api.patch(`/assignments/submissions/${submissionId}/review`, data),
  deleteSubmission: (submissionId) => api.delete(`/assignments/submissions/${submissionId}`),
};

export const quizService = {
  getQuiz: (id) => api.get(`/quizzes/${id}`),
  submitQuiz: (id, data) => api.post(`/quizzes/${id}/submit`, data),
  generateQuiz: (data) => api.post('/quizzes/generate', data),
};

export const chatService = {
  getContacts: () => api.get('/chat/contacts'),
  getHistory: (otherUserId) => api.get(`/chat/history/${otherUserId}`),
};

export const inboxService = {
  getInstructorInbox: () => api.get('/instructor/inbox/assignments'),
  getStudentInbox: () => api.get('/students/inbox/reviews'),
};

export const notificationService = {
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
};

export const lessonService = {
  createLesson: (sectionId, formData) => api.post(`/sections/${sectionId}/lessons`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  updateLesson: (id, data) => api.patch(`/lessons/${id}`, data),
  deleteLesson: (id) => api.delete(`/lessons/${id}`),
};

export const sectionService = {
  createSection: (courseId, data) => api.post(`/courses/${courseId}/sections`, data),
};

export const enrollmentService = {
  // Corrected to match backend: POST /api/courses/:id/enroll
  enroll: (courseId) => api.post(`/courses/${courseId}/enroll`),
  getEnrollments: () => api.get('/enrollments'),
  updateEnrollment: (id, data) => api.patch(`/enrollments/${id}`, data),
};

export default api;
