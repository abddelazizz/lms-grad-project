import React from 'react';
import Sidebar from '../components/Sidebar';
import ProfileSidebar from '../components/ProfileSidebar';
import StudentDashboardContent from './StudentDashboardContent';
import InstructorDashboard from './InstructorDashboard';
import AdminDashboard from './AdminDashboard';
import { getUserRole } from '../utils/auth';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const role = getUserRole();

  // If admin, we render the specialized AdminDashboard directly
  if (role === 'admin') {
    return <AdminDashboard />;
  }

  // If instructor, we render the specialized InstructorDashboard directly
  if (role === 'instructor') {
    return <InstructorDashboard />;
  }

  // Default to Student Dashboard view
  return (
    <div className="dashboard-page">
      <div className="dashboard-layout">
        
        {/* Left Sidebar Component */}
        <Sidebar activePath="/dashboard" />

        {/* Main Content */}
        <main className="main-dashboard-content">
          <StudentDashboardContent />
        </main>

        {/* Right Sidebar Profile Component */}
        <ProfileSidebar />

      </div>
    </div>
  );
};

export default Dashboard;
