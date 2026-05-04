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
import VerifyEmail from './pages/VerifyEmail';
import Inbox from './pages/Inbox';
import Chat from './pages/Chat';
import Settings from './pages/Settings';
import CoursePlayer from './pages/CoursePlayer';
import InstructorUpload from './pages/InstructorUpload';
import QuizGenerator from './pages/QuizGenerator';
import CourseBuilder from './pages/CourseBuilder';
import GoogleAuthSuccess from './pages/GoogleAuthSuccess';
import ProtectedRoute, { AdminRoute, InstructorRoute } from './components/ProtectedRoute';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './styles/global.css';
import './styles/home.css';

function AppContent() {
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
        <Route path="/dashboard/quiz" element={<ProtectedRoute><QuizDetails /></ProtectedRoute>} />
        <Route path="/dashboard/assignments" element={<ProtectedRoute><Assignments /></ProtectedRoute>} />
        <Route path="/dashboard/assignment/:id" element={<ProtectedRoute><Assignment /></ProtectedRoute>} />
        <Route path="/dashboard/inbox" element={<ProtectedRoute><Inbox /></ProtectedRoute>} />
        <Route path="/dashboard/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
        <Route path="/dashboard/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/courses/:courseId/learn/lesson/:lessonId" element={<ProtectedRoute><CoursePlayer /></ProtectedRoute>} />
        
        <Route path="/instructor/course-builder" element={<InstructorRoute><CourseBuilder /></InstructorRoute>} />
        <Route path="/instructor/upload-video" element={<InstructorRoute><InstructorUpload /></InstructorRoute>} />
        <Route path="/instructor/upload-pdf" element={<InstructorRoute><InstructorUpload /></InstructorRoute>} />
        <Route path="/instructor/upload-assignment" element={<InstructorRoute><InstructorUpload /></InstructorRoute>} />
        <Route path="/instructor/quiz-generator" element={<InstructorRoute><QuizGenerator /></InstructorRoute>} />
        
        <Route path="/admin/add-teacher" element={<AdminRoute><Dashboard /></AdminRoute>} />
        <Route path="/admin/add-student" element={<AdminRoute><Dashboard /></AdminRoute>} />
        <Route path="/admin/teachers" element={<AdminRoute><Dashboard /></AdminRoute>} />
        <Route path="/admin/students" element={<AdminRoute><Dashboard /></AdminRoute>} />
        
        <Route path="/auth/google/success" element={<GoogleAuthSuccess />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
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
