import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Banner from './components/Banner';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Hero from './sections/Hero';
import Benefits from './sections/Benefits';
import CoursesSection from './sections/Courses';
import CoursesPage from './pages/Courses';
import CourseDetails from './pages/CourseDetails';
import Contact from './pages/Contact';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import About from './pages/About';
import ForgotPassword from './pages/ForgotPassword';
import QuizDetails from './pages/QuizDetails';
import Assignment from './pages/Assignment';
import Assignments from './pages/Assignments';
import Login from './pages/Login';
import Signup from './pages/Signup';
import VerifyResetOTP from './pages/VerifyResetOTP';
import Inbox from './pages/Inbox';
import Chat from './pages/Chat';
import Settings from './pages/Settings';
import CoursePlayer from './pages/CoursePlayer';
import InstructorUpload from './pages/InstructorUpload';
import QuizGenerator from './pages/QuizGenerator';
import CourseBuilder from './pages/CourseBuilder';
import InstructorMyCourses from './pages/InstructorMyCourses';
import InstructorDashboard from './pages/InstructorDashboard';
import QuizReview from './pages/QuizReview';
import AdminDashboard from './pages/AdminDashboard';
import GoogleAuthSuccess from './pages/GoogleAuthSuccess';
import ProtectedRoute, { AdminRoute, InstructorRoute, StudentRoute } from './components/ProtectedRoute';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './styles/global.css';
import './styles/home.css';

function AppContent() {
  const location = useLocation();
  const isDashboard = location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/instructor') || location.pathname.startsWith('/admin');

  return (
    <div className="bg-light-gray">
      <Banner />
      <Navbar />
      
      <Routes>
        <Route path="/" element={
          <main>
            <Hero />
            <Benefits />
            <CoursesSection />
          </main>
        } />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/courses/:id" element={<CourseDetails />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/dashboard/quiz" element={<StudentRoute><QuizDetails /></StudentRoute>} />
        <Route path="/dashboard/quiz/review/:id" element={<StudentRoute><QuizReview /></StudentRoute>} />
        <Route path="/dashboard/assignments" element={<StudentRoute><Assignments /></StudentRoute>} />
        <Route path="/dashboard/assignment/:id" element={<StudentRoute><Assignment /></StudentRoute>} />
        <Route path="/dashboard/inbox" element={<ProtectedRoute><Inbox /></ProtectedRoute>} />
        <Route path="/dashboard/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
        <Route path="/dashboard/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/courses/:courseId/learn/lesson/:lessonId" element={<ProtectedRoute><CoursePlayer /></ProtectedRoute>} />
        
        <Route path="/instructor/my-courses" element={<InstructorRoute><InstructorMyCourses /></InstructorRoute>} />
        <Route path="/instructor/manage-course/:courseId" element={<InstructorRoute><InstructorDashboard /></InstructorRoute>} />
        <Route path="/instructor/create-course" element={<InstructorRoute><CourseBuilder /></InstructorRoute>} />
        <Route path="/instructor/upload-video" element={<InstructorRoute><InstructorUpload /></InstructorRoute>} />
        <Route path="/instructor/upload-pdf" element={<InstructorRoute><InstructorUpload /></InstructorRoute>} />
        <Route path="/instructor/upload-assignment" element={<InstructorRoute><InstructorUpload /></InstructorRoute>} />
        <Route path="/instructor/quiz-generator" element={<InstructorRoute><QuizGenerator /></InstructorRoute>} />
        
        <Route path="/admin/add-teacher" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/add-student" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/teachers" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/students" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/courses" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/security-audit" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/messages" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        
        <Route path="/auth/google/success" element={<GoogleAuthSuccess />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/verify-reset-otp" element={<VerifyResetOTP />} />
      </Routes>

      <Footer />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
