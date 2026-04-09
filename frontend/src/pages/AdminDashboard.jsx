import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ProfileSidebar from '../components/ProfileSidebar';
import { adminService } from '../services/apiService';
import '../styles/Dashboard.css';

const AdminDashboard = () => {
  const location = useLocation();
  const path = location.pathname;
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [formData, setFormData] = useState({ fullName: '', email: '', password: '', phone: '', class: '', gender: '', subject: '' });

  // Determination of view based on path
  const isAddTeacher = path.includes('add-teacher');
  const isAddStudent = path.includes('add-student');
  const isTeachersList = path.includes('teachers');
  const isStudentsList = path.includes('students');

  useEffect(() => {
    if (isTeachersList) fetchTeachers();
    if (isStudentsList) fetchStudents();
  }, [path]);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const res = await adminService.getInstructors();
      setTeachers(res.data.data.instructors || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await adminService.getStudents();
      setStudents(res.data.data.students || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddTeacher = async () => {
    try {
      setLoading(true);
      await adminService.addInstructor({
        name: formData.fullName,
        email: formData.email,
        password: formData.password,
        phone_number: formData.phone,
        specialization: formData.subject || 'All'
      });
      alert('Teacher added successfully!');
      setFormData({ fullName: '', email: '', password: '', phone: '', class: '', gender: '', subject: '' });
    } catch (err) {
      alert(err.response?.data?.message || 'Error adding teacher');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async () => {
    try {
      setLoading(true);
      await adminService.addStudent({
        name: formData.fullName,
        email: formData.email,
        password: formData.password,
        phone_number: formData.phone,
        grade_level: formData.class || 'None'
      });
      alert('Student added successfully!');
      setFormData({ fullName: '', email: '', password: '', phone: '', class: '', gender: '', subject: '' });
      fetchStudents();
    } catch (err) {
      alert(err.response?.data?.message || 'Error adding student');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTeacher = async (id) => {
    if (window.confirm('Are you sure you want to remove this teacher?')) {
      try {
        await adminService.removeInstructor(id);
        alert('Teacher removed successfully');
        fetchTeachers();
      } catch (err) {
        alert('Failed to remove teacher');
      }
    }
  };

  const handleDeleteStudent = async (id) => {
    if (window.confirm('Are you sure you want to remove this student?')) {
      try {
        await adminService.removeStudent(id);
        alert('Student removed successfully');
        fetchStudents();
      } catch (err) {
        alert('Failed to remove student');
      }
    }
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-layout">
        <Sidebar activePath={path} />

        <main className="main-dashboard-content w-100 p-4">
          <div className="container-fluid pt-5 mt-4 mx-auto" style={{ maxWidth: '1000px' }}>
            
            {/* Conditional Sub-header and Form/Table */}
            {isAddTeacher && (
              <div className="admin-form-container bg-white p-5 rounded-4 shadow-sm border mt-5">
                <h2 className="fw-bold mb-5">Add Teachers</h2>
                <div className="row g-4">
                  <div className="col-12">
                    <label className="small text-muted mb-2">Full Name</label>
                    <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} className="form-control bg-light-gray" placeholder="e.g. Kristin Watson" />
                  </div>
                  <div className="col-md-6">
                    <label className="small text-muted mb-2">Email address</label>
                    <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="form-control bg-light-gray" placeholder="michelle.rivera@example.com" />
                  </div>
                  <div className="col-md-3">
                    <label className="small text-muted mb-2">Class</label>
                    <select name="class" value={formData.class} onChange={handleInputChange} className="form-select bg-light-gray">
                      <option value="">Select Class</option>
                      <option value="J SS 2">J SS 2</option>
                      <option value="JSS 3">JSS 3</option>
                      <option value="SS 3">SS 3</option>
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="small text-muted mb-2">Gender</label>
                    <select name="gender" value={formData.gender} onChange={handleInputChange} className="form-select bg-light-gray">
                      <option value="">Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="small text-muted mb-2">Password</label>
                    <input type="password" name="password" value={formData.password} onChange={handleInputChange} className="form-control bg-light-gray" />
                  </div>
                  <div className="col-md-6">
                    <label className="small text-muted mb-2">Phone number</label>
                    <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} className="form-control bg-light-gray" />
                  </div>
                  <div className="col-md-6">
                    <label className="small text-muted mb-2">Subject</label>
                    <select name="subject" value={formData.subject} onChange={handleInputChange} className="form-select bg-light-gray">
                      <option value="">Select Subject</option>
                      <option value="Chemistry">Chemistry</option>
                      <option value="French">French</option>
                      <option value="Maths">Maths</option>
                    </select>
                  </div>
                </div>
                <div className="mt-5 d-flex align-items-center gap-4">
                   <div className="text-secondary" style={{ cursor: 'pointer' }} onClick={() => setFormData({ fullName: '', email: '', password: '', phone: '', class: '', gender: '', subject: '' })}>
                     <i className="fas fa-undo me-2"></i> Reset Form
                   </div>
                   <button className="btn btn-primary-custom px-5 py-2 fw-bold rounded-3" onClick={handleAddTeacher} disabled={loading}>
                     {loading ? 'Adding...' : 'Add Teacher'}
                   </button>
                </div>
              </div>
            )}

            {isAddStudent && (
              <div className="admin-form-container bg-white p-5 rounded-4 shadow-sm border mt-5">
                <h2 className="fw-bold mb-5">Add Students</h2>
                <div className="row g-4">
                  <div className="col-md-6">
                    <label className="small text-muted mb-2">Name</label>
                    <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} className="form-control bg-light-gray" />
                  </div>
                  <div className="col-md-3">
                    <label className="small text-muted mb-2">Class</label>
                    <select name="class" value={formData.class} onChange={handleInputChange} className="form-select bg-light-gray">
                      <option value="">Select Class</option>
                      <option value="J SS 2">J SS 2</option>
                      <option value="JSS 3">JSS 3</option>
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="small text-muted mb-2">Gender</label>
                    <select name="gender" value={formData.gender} onChange={handleInputChange} className="form-select bg-light-gray">
                      <option value="">Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="small text-muted mb-2">Email address</label>
                    <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="form-control bg-light-gray" />
                  </div>
                  <div className="col-md-6">
                    <label className="small text-muted mb-2">Phone number</label>
                    <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} className="form-control bg-light-gray" />
                  </div>
                  <div className="col-md-6">
                    <label className="small text-muted mb-2">Password</label>
                    <input type="password" name="password" value={formData.password} onChange={handleInputChange} className="form-control bg-light-gray" />
                  </div>
                </div>
                <div className="mt-5 d-flex align-items-center gap-4">
                   <div className="text-secondary" style={{ cursor: 'pointer' }} onClick={() => setFormData({ fullName: '', email: '', password: '', phone: '', class: '', gender: '', subject: '' })}>
                     <i className="fas fa-undo me-2"></i> Reset Form
                   </div>
                   <button className="btn btn-primary-custom px-5 py-2 fw-bold rounded-3" onClick={handleAddStudent} disabled={loading}>
                     {loading ? 'Adding...' : 'Add student'}
                   </button>
                </div>
              </div>
            )}

            {(isTeachersList || isStudentsList) && (
              <div className="admin-list-container">
                 <div className="search-bar-wrapper mb-5 mx-auto" style={{ maxWidth: '800px' }}>
                    <i className="fas fa-search search-icon"></i>
                    <input type="text" className="search-input" placeholder={`Search for a ${isTeachersList ? 'teacher' : 'student'} by name or email`} />
                 </div>

                 <div className="bg-white rounded-4 shadow-sm border overflow-hidden p-4">
                    {loading ? (
                      <div className="text-center p-5"><div className="spinner-border text-primary"></div></div>
                    ) : (
                      <table className="table table-borderless align-middle mb-0">
                        <thead>
                          <tr className="text-muted" style={{ fontSize: '13px' }}>
                            <th className="fw-bold">Name</th>
                            <th className="fw-bold">{isTeachersList ? 'Specialization' : 'Email'}</th>
                            <th className="fw-bold">Level</th>
                            <th className="fw-bold">Phone</th>
                            <th className="fw-bold">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(isTeachersList ? teachers : students).map((user, i) => (
                            <tr key={user.user_id || i} className={i % 2 === 1 ? 'admin-table-row-tint' : ''} style={{ fontSize: '12px' }}>
                              <td className="py-3">
                                <div className="d-flex align-items-center gap-2">
                                    <img src={user.User?.picture || 'https://i.pravatar.cc/150'} className="rounded-circle" width="32" height="32" alt={user.name} />
                                    <span className="fw-bold">{user.name || user.User?.name}</span>
                                </div>
                              </td>
                              <td>{isTeachersList ? user.specialization : user.User?.email}</td>
                              <td>{user.grade_level || 'N/A'}</td>
                              <td>{user.phone_number || 'N/A'}</td>
                              <td>
                                 <button 
                                   className="btn btn-sm text-danger"
                                   onClick={() => isTeachersList ? handleDeleteTeacher(user.id) : handleDeleteStudent(user.id)}
                                 >
                                   <i className="fas fa-trash"></i>
                                 </button>
                              </td>
                            </tr>
                          ))}
                          {(isTeachersList ? teachers : students).length === 0 && (
                            <tr><td colSpan="5" className="text-center p-5 text-muted">No records found.</td></tr>
                          )}
                        </tbody>
                      </table>
                    )}
                 </div>
              </div>
            )}

          </div>
        </main>

        <ProfileSidebar />
      </div>
    </div>
  );
};

export default AdminDashboard;
