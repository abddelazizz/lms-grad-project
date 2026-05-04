import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_BASE_URL = `${BASE_URL}/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add a request interceptor to include the JWT token in all requests
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor to handle 401 Unauthorized errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes('/auth/refresh')) {
      originalRequest._retry = true;
      try {
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, { withCredentials: true });
        const { token } = response.data;
        sessionStorage.setItem('accessToken', token);
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      } catch (refreshError) {
        sessionStorage.removeItem('accessToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);


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
  saveQuiz: (data) => api.post('/quizzes/save', data),
  publishQuiz: (id) => api.post(`/quizzes/${id}/publish`),
};

export const chatService = {
  getConversations: () => api.get('/chat/conversations'),
  getMessages: (conversationId, page = 1, limit = 50) => 
    api.get(`/chat/conversations/${conversationId}/messages?page=${page}&limit=${limit}`),
  createConversation: (otherUserId) => api.post('/chat/conversations', { otherUserId }),
  markAsRead: (conversationId) => api.patch(`/chat/conversations/${conversationId}/read`),
};

export const inboxService = {
  getInstructorInbox: () => api.get('/instructor/inbox/assignments'),
  getStudentInbox: () => api.get('/students/inbox/reviews'),
};

export const notificationService = {
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  getUserNotifications: (role) => {
    if (role === 'instructor' || role === 'admin') {
      return api.get('/instructor/inbox/assignments');
    }
    return api.get('/students/inbox/reviews');
  },
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
