import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './styles/global.css';
import './styles/home.css';

function App() {
  return (
    <Router>
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
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/quiz" element={<QuizDetails />} />
          <Route path="/dashboard/assignments" element={<Assignments />} />
          <Route path="/dashboard/assignment/:id" element={<Assignment />} />
          <Route path="/dashboard/inbox" element={<Inbox />} />
          <Route path="/dashboard/chat" element={<Chat />} />
          <Route path="/dashboard/settings" element={<Settings />} />
          <Route path="/courses/:courseId/learn/lesson/:lessonId" element={<CoursePlayer />} />
          
          {/* Instructor Routes */}
          <Route path="/instructor/course-builder" element={<CourseBuilder />} />
          <Route path="/instructor/upload-video" element={<InstructorUpload />} />
          <Route path="/instructor/upload-pdf" element={<InstructorUpload />} />
          <Route path="/instructor/upload-assignment" element={<InstructorUpload />} />
          <Route path="/instructor/quiz-generator" element={<QuizGenerator />} />
          
          {/* Admin Routes */}
          <Route path="/admin/add-teacher" element={<Dashboard />} />
          <Route path="/admin/add-student" element={<Dashboard />} />
          <Route path="/admin/teachers" element={<Dashboard />} />
          <Route path="/admin/students" element={<Dashboard />} />
          
          <Route path="/auth/google/success" element={<GoogleAuthSuccess />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
        </Routes>

        <Footer />
      </div>
    </Router>
  );
}

export default App;