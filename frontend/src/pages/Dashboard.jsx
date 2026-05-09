import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import ProfileSidebar from '../components/ProfileSidebar';
import MobileNavbar from '../components/MobileNavbar';
import StudentDashboardContent from './StudentDashboardContent';
import InstructorDashboard from './InstructorDashboard';
import AdminDashboard from './AdminDashboard';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const role = user?.role;
  const [searchTerm, setSearchTerm] = useState('');

  if (role === 'admin') return <AdminDashboard />;
  if (role === 'instructor') return <InstructorDashboard />;

  return (
    <>
      <div className="dashboard-page">
        <MobileNavbar value={searchTerm} onChange={setSearchTerm} placeholder="Search your learning journey..." />
        <div className="dashboard-layout">
          <Sidebar activePath="/dashboard" />
          <main className="main-dashboard-content">
            <StudentDashboardContent searchTerm={searchTerm} />
          </main>
          <ProfileSidebar />
        </div>
      </div>
    </>
  );
};

export default Dashboard;
