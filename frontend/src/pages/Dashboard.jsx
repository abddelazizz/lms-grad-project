import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import ProfileSidebar from '../components/ProfileSidebar';
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
      {/* ── Global Search Bar — spans full width above the layout ── */}
      <div className="dashboard-search-topbar">
        <div className="dashboard-search-inner">
          <i className="fas fa-search dashboard-search-icon"></i>
          <input
            type="text"
            className="dashboard-search-input"
            placeholder="Search your learning journey..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="dashboard-search-clear" onClick={() => setSearchTerm('')}>
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>
      </div>

      <div className="dashboard-page">
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
