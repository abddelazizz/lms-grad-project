import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ProfileSidebar from '../components/ProfileSidebar';
import { useAuth } from '../contexts/AuthContext';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import '../styles/Dashboard.css';

const AdminDashboard = () => {
  const location = useLocation();
  const path = location.pathname;
  const { api } = useAuth();
  const [loading, setLoading] = useState(false);

  const adminService = {
    getStats: () => api.get('/admin/dashboard/stats'),
    getInstructors: () => api.get('/admin/instructors'),
    getInstructor: (id) => api.get(`/admin/instructors/${id}`),
    addInstructor: (data) => api.post('/admin/instructors', data),
    removeInstructor: (id) => api.delete(`/admin/instructors/${id}`),
    getStudents: () => api.get('/admin/students'),
    getStudent: (id) => api.get(`/admin/students/${id}`),
    addStudent: (data) => api.post('/admin/students', data),
    removeStudent: (id) => api.delete(`/admin/students/${id}`)
  };


  const studentService = {
    updateProfilePictureById: (id, formData) => api.patch(`/students/${id}/profile-picture`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  };
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalInstructors: 0, totalStudents: 0, totalCourses: 0, totalRevenue: '0.00' });
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({ fullName: '', email: '', password: '', phone: '', class: '', gender: '', subject: '' });

  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  // Determination of view based on path
  const isAddTeacher = path.includes('add-teacher');
  const isAddStudent = path.includes('add-student');
  const isTeachersList = path.includes('teachers');
  const isStudentsList = path.includes('students');
  const isCoursesList = path.includes('courses');
  const isSecurityAudit = path.includes('security-audit');
  const isMessagesList = path.includes('messages');

  const [courses, setCourses] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);


  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (isTeachersList) fetchTeachers();
      else if (isStudentsList) fetchStudents();
      else if (isCoursesList) fetchCourses();
      else if (isSecurityAudit) fetchAuditLogs();
      else if (!isAddTeacher && !isAddStudent && !isMessagesList) {
        fetchStats();
        fetchTeachers();
        fetchStudents();
      }
    }, 500); // 500ms debounce


    return () => clearTimeout(delayDebounceFn);
  }, [path, searchQuery]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await adminService.getStats();
      setStats(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const res = await adminService.getInstructors();
      const list = res.data?.data?.data || res.data?.data || res.data || [];
      setTeachers(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('FAILED TO FETCH TEACHERS:', err);
      setTeachers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await adminService.getStudents();
      const list = res.data?.data?.data || res.data?.data || res.data || [];
      setStudents(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('FAILED TO FETCH STUDENTS:', err);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await api.get('/courses?limit=100');
      setCourses(res.data?.data?.courses || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/audit-logs');
      setAuditLogs(res.data?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };



  const handleDeleteCourse = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "This will delete the course permanently!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#31506a',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/courses/${id}`);
        toast.success('Course deleted');
        fetchCourses();
      } catch (err) {
        toast.error('Failed to delete course');
      }
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
      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'Teacher added successfully!',
        confirmButtonColor: '#31506a'
      });
      setFormData({ fullName: '', email: '', password: '', phone: '', class: '', gender: '', subject: '' });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.response?.data?.message || 'Error adding teacher',
        confirmButtonColor: '#31506a'
      });
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
      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'Student added successfully!',
        confirmButtonColor: '#31506a'
      });
      setFormData({ fullName: '', email: '', password: '', phone: '', class: '', gender: '', subject: '' });
      fetchStudents();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.response?.data?.message || 'Error adding student',
        confirmButtonColor: '#31506a'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTeacher = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#31506a',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await adminService.removeInstructor(id);
        Swal.fire({
          icon: 'success',
          title: 'Removed!',
          text: 'Teacher removed successfully',
          confirmButtonColor: '#31506a'
        });
        fetchTeachers();
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to remove teacher',
          confirmButtonColor: '#31506a'
        });
      }
    }
  };

  const handleDeleteStudent = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#31506a',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await adminService.removeStudent(id);
        Swal.fire({
          icon: 'success',
          title: 'Removed!',
          text: 'Student removed successfully',
          confirmButtonColor: '#31506a'
        });
        fetchStudents();
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to remove student',
          confirmButtonColor: '#31506a'
        });
      }
    }
  };

  const handleViewDetails = async (id, isTeacher) => {
    setModalLoading(true);
    setShowModal(true);
    setSelectedUser({ isTeacher });
    setSelectedFile(null);
    try {
      const res = isTeacher ? await adminService.getInstructor(id) : await adminService.getStudent(id);
      setSelectedUser({ ...(res.data?.data || res.data), isTeacher, _id: id });
    } catch (err) {
      console.error(err);
      setSelectedUser({ error: "Failed to load details" });
    } finally {
      setModalLoading(false);
    }
  };

  const handleUpdatePicture = async (id) => {
    if (!selectedFile) {
      return Swal.fire({
        icon: 'info',
        text: 'Select a file first.',
        confirmButtonColor: '#31506a'
      });
    }
    try {
      const form = new FormData();
      form.append("profile_picture", selectedFile);
      await studentService.updateProfilePictureById(id, form);
      Swal.fire({
        icon: 'success',
        title: 'Updated',
        text: 'Profile picture updated!',
        confirmButtonColor: '#31506a'
      });
      fetchStudents();
      setShowModal(false);
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.response?.data?.message || "Failed to update picture.",
        confirmButtonColor: '#31506a'
      });
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
                <div className="d-flex align-items-center justify-content-between mb-5">
                  <h2 className="fw-bold m-0">Create New Teacher</h2>
                  <span className="badge bg-soft-primary text-primary px-3 py-2 rounded-pill">Instructor Access</span>
                </div>
                <div className="row g-4">
                  <div className="col-12">
                    <div className="form-group">
                      <label className="text-secondary small fw-bold mb-2">FULL NAME</label>
                      <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} className="form-control admin-input py-2 px-3" placeholder="e.g. Dr. Kristin Watson" />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="text-secondary small fw-bold mb-2">EMAIL ADDRESS</label>
                      <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="form-control admin-input py-2 px-3" placeholder="michelle.rivera@example.com" />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="text-secondary small fw-bold mb-2">PASSWORD</label>
                      <input type="password" name="password" value={formData.password} onChange={handleInputChange} className="form-control admin-input py-2 px-3" />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="text-secondary small fw-bold mb-2">SUBJECT / SPECIALIZATION</label>
                      <input type="text" name="subject" value={formData.subject} onChange={handleInputChange} className="form-control admin-input py-2 px-3" placeholder="e.g. Mathematics" />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="text-secondary small fw-bold mb-2">PHONE NUMBER</label>
                      <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} className="form-control admin-input py-2 px-3" />
                    </div>
                  </div>
                </div>
                <div className="mt-5 d-flex align-items-center gap-4">
                  <button className="btn btn-primary px-5 py-2 fw-bold rounded-3 hstack gap-2" onClick={handleAddTeacher} disabled={loading}>
                    {loading && <span className="spinner-border spinner-border-sm"></span>}
                    <span>Add Teacher Account</span>
                  </button>
                  <button className="btn btn-link text-muted text-decoration-none" onClick={() => setFormData({ fullName: '', email: '', password: '', phone: '', class: '', gender: '', subject: '' })}>
                    Reset Form
                  </button>
                </div>
              </div>
            )}

            {/* Overview Stats - Shown if no sub-page active */}
            {!isAddTeacher && !isAddStudent && !isTeachersList && !isStudentsList && !isCoursesList && (
              <div className="admin-overview mt-5">
                <h2 className="fw-bold mb-5">Admin Overview</h2>
                <div className="row g-4 mb-5">
                  {[
                    { label: 'Total Teachers', count: stats.totalInstructors, icon: 'fa-chalkboard-teacher', color: '#385b73' },
                    { label: 'Total Students', count: stats.totalStudents, icon: 'fa-user-graduate', color: '#7793a8' },
                    { label: 'Total Courses', count: stats.totalCourses, icon: 'fa-book', color: '#a0b3c1' },
                    { label: 'Total Revenue', count: `$${stats.totalRevenue}`, icon: 'fa-wallet', color: '#2c4a5e' },
                  ].map((item, i) => (
                    <div key={i} className="col-md-3">
                      <div className="bg-white p-4 rounded-4 shadow-sm border h-100 d-flex flex-column align-items-center justify-content-center text-center">
                        <div className="rounded-circle mb-3 d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px', backgroundColor: `${item.color}15`, color: item.color }}>
                          <i className={`fas ${item.icon} fa-lg`}></i>
                        </div>
                        <h3 className="h2 fw-bold mb-1" style={{ color: '#1a1d20' }}>{item.count}</h3>
                        <p className="text-muted small mb-0 fw-medium">{item.label}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-white p-5 rounded-4 shadow-sm border mb-4">
                  <h4 className="fw-bold mb-4">Platform Performance</h4>
                  <p className="text-muted">The platform is currently hosting <strong>{stats.totalCourses}</strong> courses with a graduation/enrollment rate of <strong>{stats.stats?.verificationRate}%</strong>. Monitor student intake and teacher additions from the side menu.</p>
                </div>

                <div className="row g-4">
                  <div className="col-md-6">
                    <div className="bg-white p-4 rounded-4 shadow-sm border h-100">
                      <h5 className="fw-bold mb-4">Recently Added Teachers</h5>
                      {teachers.slice(0, 3).map((u, i) => (
                        <div key={i} className="d-flex align-items-center gap-3 mb-3 pb-3 border-bottom">
                          <img src={u.picture || u.User?.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || u.User?.name || 'User')}&background=e0e7ff&color=31506a`} className="rounded-circle" width="40" height="40" alt="profile" />
                          <div>
                            <div className="fw-bold fs-6">{u.name || u.User?.name}</div>
                            <div className="text-muted small">{u.instructorProfile?.specialization || u.Instructor?.specialization || 'General'}</div>
                          </div>
                        </div>
                      ))}
                      {!teachers.length && <div className="text-muted small">No teachers found.</div>}
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="bg-white p-4 rounded-4 shadow-sm border h-100">
                      <h5 className="fw-bold mb-4">Recently Enrolled Students</h5>
                      {students.slice(0, 3).map((u, i) => (
                        <div key={i} className="d-flex align-items-center gap-3 mb-3 pb-3 border-bottom">
                          <img src={u.picture || u.User?.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || u.User?.name || 'User')}&background=e0e7ff&color=31506a`} className="rounded-circle" width="40" height="40" alt="profile" />
                          <div>
                            <div className="fw-bold fs-6">{u.name || u.User?.name}</div>
                            <div className="text-muted small">Level: {u.studentProfile?.grade_level || u.Student?.grade_level || 'N/A'}</div>
                          </div>
                        </div>
                      ))}
                      {!students.length && <div className="text-muted small">No students found.</div>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {isAddStudent && (
              <div className="admin-form-container bg-white p-5 rounded-4 shadow-sm border mt-5">
                <div className="d-flex align-items-center justify-content-between mb-5">
                  <h2 className="fw-bold m-0">Enroll New Student</h2>
                  <span className="badge bg-soft-success text-success px-3 py-2 rounded-pill">Student Access</span>
                </div>
                <div className="row g-4">
                  <div className="col-md-8">
                    <div className="form-group">
                      <label className="text-secondary small fw-bold mb-2">STUDENT NAME</label>
                      <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} className="form-control admin-input py-2 px-3" />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="form-group">
                      <label className="text-secondary small fw-bold mb-2">GRADE LEVEL</label>
                      <select name="class" value={formData.class} onChange={handleInputChange} className="form-select admin-input py-2 px-3">
                        <option value="">Select Grade</option>
                        <option value="J SS 2">J SS 2</option>
                        <option value="JSS 3">JSS 3</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="text-secondary small fw-bold mb-2">EMAIL ADDRESS</label>
                      <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="form-control admin-input py-2 px-3" />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="text-secondary small fw-bold mb-2">PASSWORD</label>
                      <input type="password" name="password" value={formData.password} onChange={handleInputChange} className="form-control admin-input py-2 px-3" />
                    </div>
                  </div>
                </div>
                <div className="mt-5 d-flex align-items-center gap-4">
                  <button className="btn btn-success px-5 py-2 fw-bold rounded-3 hstack gap-2 text-white" onClick={handleAddStudent} disabled={loading}>
                    {loading && <span className="spinner-border spinner-border-sm"></span>}
                    <span>Enroll Student</span>
                  </button>
                  <button className="btn btn-link text-muted text-decoration-none" onClick={() => setFormData({ fullName: '', email: '', password: '', phone: '', class: '', gender: '', subject: '' })}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {isMessagesList && (
              <div className="admin-messages-container">
                <h2 className="fw-bold mb-5">Contact Messages</h2>
                <div className="bg-white rounded-4 shadow-sm border p-5 text-center">
                  <div className="rounded-circle bg-light d-flex align-items-center justify-content-center mx-auto mb-4" style={{ width: '80px', height: '80px' }}>
                    <i className="fas fa-envelope-open-text fa-2x text-muted"></i>
                  </div>
                  <h4 className="fw-bold">Email Management Active</h4>
                  <p className="text-muted mx-auto" style={{ maxWidth: '500px' }}>
                    Currently, all inquiries from the "Contact Us" form are forwarded directly to the administrator's registered email address.
                    <br /><br />
                    <span className="badge bg-info bg-opacity-10 text-info px-3 py-2">Backend Note</span>
                    <br />
                    To display messages here, the backend needs to be updated to store contact form submissions in the database.
                  </p>
                  <button className="btn btn-primary mt-3 px-4 py-2" onClick={() => window.open('mailto:admin@evolvesight.com')}>
                    Open Admin Mailbox
                  </button>
                </div>
              </div>
            )}
            <div className="admin-list-container">
              <div className="search-bar-wrapper mb-5 mx-auto" style={{ maxWidth: '800px' }}>
                <i className="fas fa-search search-icon"></i>
                <input
                  type="text"
                  className="search-input"
                  placeholder={`Search for a ${isTeachersList ? 'teacher' : 'student'} by name or email`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="bg-white rounded-4 shadow-sm border overflow-hidden p-4">
                {loading ? (
                  <div className="text-center p-5"><div className="spinner-border text-primary"></div></div>
                ) : (
                  <table className="table table-hover align-middle mb-0" style={{ borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                    <thead>
                      <tr className="text-secondary text-uppercase border-bottom-0" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>
                        <th className="fw-bold px-4 border-0 pb-3">{isTeachersList ? 'Teacher Details' : 'Student Details'}</th>
                        <th className="fw-bold px-4 border-0 pb-3">{isTeachersList ? 'Specialization' : 'Grade Level'}</th>
                        <th className="fw-bold px-4 border-0 pb-3">Phone Number</th>
                        <th className="fw-bold px-4 border-0 pb-3 text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(isTeachersList ? teachers : students).map((user, i) => {
                        const displayName = user.name || user.User?.name;
                        const displayEmail = user.email || user.User?.email;
                        const displayPicture = user.picture || user.User?.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.User?.name || 'User')}&background=e0e7ff&color=31506a`;

                        return (
                          <tr key={user.user_id || user.id || i} className="bg-white shadow-sm" style={{ transition: 'all 0.2s ease', borderRadius: '12px' }}>
                            <td className="py-3 px-4" style={{ borderTopLeftRadius: '12px', borderBottomLeftRadius: '12px', borderTop: '1px solid #f1f3f5', borderBottom: '1px solid #f1f3f5', borderLeft: '1px solid #f1f3f5' }}>
                              <div className="d-flex align-items-center gap-3">
                                <img src={displayPicture} className="rounded-circle shadow-sm" width="42" height="42" alt={displayName} style={{ objectFit: 'cover' }} />
                                <div className="d-flex flex-column">
                                  <span className="fw-bold text-dark fs-6">{displayName}</span>
                                  <span className="text-secondary mt-1" style={{ fontSize: '12px' }}>{displayEmail}</span>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-secondary fw-medium" style={{ borderTop: '1px solid #f1f3f5', borderBottom: '1px solid #f1f3f5' }}>
                              {isTeachersList
                                ? (user.instructorProfile?.specialization || user.Instructor?.specialization || 'General')
                                : <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-2 rounded-pill fw-bold border border-primary-subtle">{user.studentProfile?.grade_level || user.Student?.grade_level || user.grade_level || 'N/A'}</span>
                              }
                            </td>
                            <td className="py-3 px-4 text-secondary fw-medium" style={{ borderTop: '1px solid #f1f3f5', borderBottom: '1px solid #f1f3f5' }}>
                              {user.phone_number || user.User?.phone_number || <span className="text-muted fst-italic">Not provided</span>}
                            </td>
                            <td className="py-3 px-4 text-end" style={{ borderTopRightRadius: '12px', borderBottomRightRadius: '12px', borderTop: '1px solid #f1f3f5', borderBottom: '1px solid #f1f3f5', borderRight: '1px solid #f1f3f5' }}>
                              <div className="d-flex gap-2 justify-content-end">
                                <button
                                  className="btn btn-sm btn-action text-primary bg-primary bg-opacity-10 rounded-3 px-3 py-2 border-0 fw-bold transition-all"
                                  style={{ fontSize: '13px' }}
                                  title="View"
                                  onClick={() => handleViewDetails(user.user_id || user.id, isTeachersList)}
                                >
                                  <i className="fas fa-eye me-1"></i> View Details
                                </button>
                                <button
                                  className="btn btn-sm btn-action text-danger bg-danger bg-opacity-10 rounded-3 px-3 py-2 border-0 fw-bold transition-all"
                                  style={{ fontSize: '13px' }}
                                  onClick={() => isTeachersList ? handleDeleteTeacher(user.user_id || user.id) : handleDeleteStudent(user.user_id || user.id)}
                                  title="Remove"
                                >
                                  <i className="fas fa-trash me-1"></i> Remove
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                      {(isTeachersList ? teachers : students).length === 0 && (
                        <tr>
                          <td colSpan="4" className="text-center p-5 text-muted border border-light rounded-4 bg-light">
                            <i className="fas fa-box-open fs-2 mb-3 text-secondary opacity-50 d-block"></i>
                            No records found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {isCoursesList && (
              <div className="admin-list-container">
                <h2 className="fw-bold mb-5">Course Management</h2>
                <div className="bg-white rounded-4 shadow-sm border overflow-hidden p-4">
                  {loading ? (
                    <div className="text-center p-5"><div className="spinner-border text-primary"></div></div>
                  ) : (
                    <table className="table table-hover align-middle mb-0">
                      <thead>
                        <tr className="text-secondary text-uppercase" style={{ fontSize: '11px' }}>
                          <th className="px-4 pb-3">Course Title</th>
                          <th className="px-4 pb-3">Instructor</th>
                          <th className="px-4 pb-3">Price</th>
                          <th className="px-4 pb-3">Status</th>
                          <th className="px-4 pb-3 text-end">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {courses.map((course) => (
                          <tr key={course.course_id}>
                            <td className="px-4 py-3 fw-bold">{course.title}</td>
                            <td className="px-4 py-3">{course.instructor?.name || 'Admin'}</td>
                            <td className="px-4 py-3">${course.price}</td>
                            <td className="px-4 py-3">
                              <span className={`badge rounded-pill ${course.status === 'published' ? 'bg-success' : 'bg-warning'} bg-opacity-10 ${course.status === 'published' ? 'text-success' : 'text-warning'}`}>
                                {course.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-end">
                              <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteCourse(course.course_id)}>
                                <i className="fas fa-trash"></i>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {isSecurityAudit && (
              <div className="admin-list-container">
                <h2 className="fw-bold mb-5">Security Audit Logs</h2>
                <div className="bg-white rounded-4 shadow-sm border overflow-hidden p-4">
                  {loading ? (
                    <div className="text-center p-5"><div className="spinner-border text-primary"></div></div>
                  ) : (
                    <table className="table table-hover align-middle mb-0">
                      <thead>
                        <tr className="text-secondary text-uppercase" style={{ fontSize: '11px' }}>
                          <th className="px-4 pb-3">Event Type</th>
                          <th className="px-4 pb-3">User</th>
                          <th className="px-4 pb-3">IP Address</th>
                          <th className="px-4 pb-3">Timestamp</th>
                          <th className="px-4 pb-3">Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {auditLogs.map((log, i) => (
                          <tr key={log.id || i}>
                            <td className="px-4 py-3 fw-bold">{log.action || 'Login'}</td>
                            <td className="px-4 py-3">{log.user_email || log.email || 'N/A'}</td>
                            <td className="px-4 py-3">{log.ip_address || '127.0.0.1'}</td>
                            <td className="px-4 py-3 text-muted">{new Date(log.created_at).toLocaleString()}</td>
                            <td className="px-4 py-3 small text-truncate" style={{ maxWidth: '200px' }}>{log.metadata ? JSON.stringify(log.metadata) : 'N/A'}</td>
                          </tr>
                        ))}
                        {auditLogs.length === 0 && (
                          <tr>
                            <td colSpan="5" className="text-center p-5 text-muted">No audit logs found.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}
          </div>

        </main>

        {showModal && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 rounded-4 shadow">
                <div className="modal-header border-0 pb-0">
                  <h5 className="modal-title fw-bold">User Details</h5>
                  <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                </div>
                <div className="modal-body pt-4">
                  {modalLoading ? (
                    <div className="text-center py-4"><div className="spinner-border text-primary"></div></div>
                  ) : selectedUser?.error ? (
                    <div className="alert alert-danger">{selectedUser.error}</div>
                  ) : selectedUser ? (
                    <div className="vstack gap-3">
                      <div className="text-center mb-3">
                        <img src={selectedUser.picture || selectedUser.User?.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUser.name || selectedUser.User?.name || 'User')}&background=e0e7ff&color=31506a`} className="rounded-circle shadow-sm" width="80" height="80" alt="profile" style={{ objectFit: 'cover' }} />
                      </div>
                      <div className="d-flex justify-content-between border-bottom pb-2">
                        <span className="text-muted">Name</span>
                        <span className="fw-bold">{selectedUser.name || selectedUser.User?.name}</span>
                      </div>
                      <div className="d-flex justify-content-between border-bottom pb-2">
                        <span className="text-muted">Email</span>
                        <span className="fw-bold">{selectedUser.email || selectedUser.User?.email}</span>
                      </div>
                      <div className="d-flex justify-content-between border-bottom pb-2">
                        <span className="text-muted">Role</span>
                        <span className="fw-bold">{selectedUser.isTeacher ? 'Instructor' : 'Student'}</span>
                      </div>

                      {!selectedUser.isTeacher && selectedUser._id && (
                        <div className="mt-3">
                          <label className="fw-bold mb-2 small text-secondary">Update Profile Picture</label>
                          <input type="file" className="form-control mb-2" onChange={(e) => setSelectedFile(e.target.files[0])} />
                          <button className="btn btn-sm btn-primary w-100 fw-bold py-2" onClick={() => handleUpdatePicture(selectedUser._id)}>Upload Picture</button>
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        )}

        <ProfileSidebar />
      </div>
    </div>
  );
};

export default AdminDashboard;
