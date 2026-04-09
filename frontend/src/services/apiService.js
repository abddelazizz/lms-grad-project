import axios from 'axios';

const BASE_URL = 'http://localhost:5000';
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
};

export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  signup: (userData) => api.post('/auth/register', userData),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  resendVerification: (email) => api.post('/auth/resend-verification', { email }),
  verifyOTP: (otp) => api.post('/auth/verify-otp', { otp }),
  verifyResetOTP: (data) => api.post('/auth/verify-reset-otp', data),
};

export const API_BASE = BASE_URL;

export const adminService = {
  getInstructors: () => api.get('/admin/instructors'),
  addInstructor: (data) => api.post('/admin/instructors', data),
  removeInstructor: (id) => api.delete(`/admin/instructors/${id}`),
  getStudents: () => api.get('/admin/students'),
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
};

export const contactService = {
  submitForm: (data) => api.post('/contact', data),
};

export const instructorService = {
  getStats: () => api.get('/instructor/dashboard-stats'),
  getCourseDetails: (id) => api.get(`/instructor/courses/${id}/details`),
};

export const assignmentService = {
  uploadAssignment: (contentId, file) => {
    const formData = new FormData();
    formData.append("assignment_file", file);
    return api.post(`/assignments/${contentId}/upload`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

export const quizService = {
  getQuiz: (id) => api.get(`/quizzes/${id}`),
  submitQuiz: (id, data) => api.post(`/quizzes/${id}/submit`, data),
};

export default api;
