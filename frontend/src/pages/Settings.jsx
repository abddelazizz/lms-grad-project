import React, { useState, useEffect, useRef } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Dashboard.css';
import '../styles/Settings.css';

// Decode JWT to extract user info without a library
const decodeToken = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
};

const Settings = () => {
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const { api, storeToken } = useAuth();
  const photoInputRef = useRef(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    userName: '',
    email: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    role: '',
    // Instructor specific
    bio: '',
    specialization: '',
    // Student specific
    grade_level: '',
  });

  // Fetch real profile data from the backend on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/students/profile');
        const userData = response.data.data;
        if (userData) {
          const nameParts = (userData.name || '').split(' ');
          
          let bio = '';
          let specialization = '';
          let grade_level = '';

          if (userData.role === 'instructor' && userData.instructorProfile) {
             bio = userData.instructorProfile.bio || '';
             specialization = userData.instructorProfile.specialization || '';
          } else if (userData.role === 'student' && userData.studentProfile) {
             grade_level = userData.studentProfile.grade_level || '';
          }

          setFormData(prev => ({
            ...prev,
            firstName: nameParts[0] || '',
            lastName: nameParts.slice(1).join(' ') || '',
            email: userData.email || '',
            userName: userData.username || '',
            phone: userData.phone_number || '',
            role: userData.role || '',
            bio,
            specialization,
            grade_level
          }));
          
          if (userData.picture) {
            setAvatarPreview(userData.picture);
          }
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        toast.error('Could not load profile data.');
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleDeletePhoto = () => {
    setAvatarPreview(null);
    setAvatarFile(null);
  };

  const handleCancel = () => {
    setFormData(prev => ({
      ...prev,
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    }));
    toast('Changes cancelled.', { icon: '↩️' });
  };

  const handleSave = async () => {
    if (formData.newPassword || formData.confirmPassword) {
      if (!formData.currentPassword) {
        return toast.error('Please enter your current password first.');
      }
      if (formData.newPassword !== formData.confirmPassword) {
        return toast.error('New passwords do not match!');
      }
      if (formData.newPassword.length < 8) {
        return toast.error('New password must be at least 8 characters.');
      }
    }

    // Auth Context handles token presence now

    setLoading(true);
    try {
      const updatePayload = {
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        phone_number: formData.phone,
        username: formData.userName,
        ...(formData.newPassword && {
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
        // Send role specific data
        ...(formData.role === 'instructor' && {
           bio: formData.bio,
           specialization: formData.specialization
        }),
        ...(formData.role === 'student' && {
           grade_level: formData.grade_level
        }),
        // If they cleared the photo visually and have no file to upload, delete from DB
        ...((!avatarPreview && !avatarFile) && {
           picture: null
        }),
      };

      const response = await api.patch('/students/profile', updatePayload);

      if (response?.data?.token) {
        storeToken(response.data.token);
      }

      if (avatarFile) {
        const photoForm = new FormData();
        photoForm.append('profile_picture', avatarFile);
        const photoResponse = await api.patch('/students/profile/photo', photoForm);
        
        if (photoResponse?.data?.token) {
          storeToken(photoResponse.data.token);
        }
      }

      toast.success('Profile updated successfully!');

      // Force a reload to reflect new token across all Navbars/Sidebars
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-page">
      <Toaster position="top-center" reverseOrder={false} />
      <div className="dashboard-layout">
        <Sidebar activePath="/dashboard/settings" />

        <div className="settings-main-content flex-grow-1 p-4">
          <div className="settings-content-wrapper pt-5 mt-4 mx-auto">

            {/* Breadcrumb */}
            <div className="d-flex align-items-center gap-2 mb-4">
              <span className="settings-breadcrumb-item">Setting</span>
              <i className="fas fa-chevron-right settings-breadcrumb-arrow"></i>
              <i className="fas fa-chevron-right settings-breadcrumb-arrow"></i>
              <span className="settings-breadcrumb-item text-capitalize">{formData.role || 'User'} Profile</span>
            </div>

            <div className="settings-card shadow-sm border-0 rounded-4">

              <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
                 <h3 className="settings-title m-0">Account Details</h3>
                 {formData.role && (
                    <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-2 rounded-pill text-capitalize fw-bold border border-primary-subtle">
                       {formData.role} Account
                    </span>
                 )}
              </div>

              {/* Profile Photo Section */}
              <div className="settings-photo-section">
                <div className="settings-avatar-wrapper">
                  <div
                    className="settings-avatar"
                    onClick={() => photoInputRef.current.click()}
                    style={{ cursor: 'pointer' }}
                  >
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Profile"
                        style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                      />
                    ) : (
                      <i className="fas fa-user settings-avatar-icon"></i>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={photoInputRef}
                    onChange={handlePhotoChange}
                    accept="image/*"
                    style={{ display: 'none' }}
                  />
                  <div className="settings-avatar-name">
                    {formData.firstName || formData.lastName
                      ? `${formData.firstName} ${formData.lastName}`.trim()
                      : 'Name'}
                  </div>
                </div>
                <div className="settings-photo-actions">
                  <button className="btn-upload-photo" onClick={() => photoInputRef.current.click()}>
                    Upload New Photo
                  </button>
                  <button className="btn-delete-photo" onClick={handleDeletePhoto}>Delete</button>
                </div>
              </div>

              <hr className="settings-divider" />

              {/* Form Grid */}
              <div className="settings-form-grid">

                <div className="settings-form-group">
                  <label className="settings-label">First Name</label>
                  <input type="text" name="firstName" className="settings-input" placeholder="eg. Alaa" value={formData.firstName} onChange={handleChange} />
                </div>
                <div className="settings-form-group">
                  <label className="settings-label">Last Name</label>
                  <input type="text" name="lastName" className="settings-input" placeholder="eg. Mohamed" value={formData.lastName} onChange={handleChange} />
                </div>

                <div className="settings-form-group">
                  <label className="settings-label">User Name</label>
                  <input type="text" name="userName" className="settings-input" placeholder="eg. alaa.mohamed" value={formData.userName} onChange={handleChange} />
                </div>
                <div className="settings-form-group">
                  <label className="settings-label">Phone Number</label>
                  <div className="settings-input-icon-wrapper">
                    <i className="fas fa-mobile-alt settings-input-icon"></i>
                    <input type="tel" name="phone" className="settings-input settings-input-with-icon" value={formData.phone} onChange={handleChange} />
                  </div>
                </div>

                <div className="settings-form-group settings-form-full">
                  <label className="settings-label">Email Address</label>
                  <div className="settings-input-icon-wrapper">
                    <i className="fas fa-envelope settings-input-icon"></i>
                    <input type="email" name="email" className="settings-input settings-input-with-icon bg-light" value={formData.email} onChange={handleChange} disabled />
                  </div>
                  <small className="text-muted mt-1 d-block"><i className="fas fa-info-circle me-1"></i> Email cannot be changed</small>
                </div>

                {/* Role Specific Fields */}
                {formData.role === 'instructor' && (
                  <>
                    <div className="settings-form-group settings-form-full mt-3">
                      <h5 className="fw-bold mb-3 border-top pt-4">Professional Details</h5>
                      <label className="settings-label">Specialization</label>
                      <input type="text" name="specialization" className="settings-input" placeholder="e.g. Mathematics, Programming" value={formData.specialization} onChange={handleChange} />
                    </div>
                    <div className="settings-form-group settings-form-full">
                      <label className="settings-label">Short Bio</label>
                      <textarea name="bio" className="settings-input" rows="3" placeholder="Tell us about your teaching experience..." value={formData.bio} onChange={handleChange}></textarea>
                    </div>
                  </>
                )}

                {formData.role === 'student' && (
                  <>
                    <div className="settings-form-group settings-form-full mt-3">
                      <h5 className="fw-bold mb-3 border-top pt-4">Academic Details</h5>
                      <label className="settings-label">Grade Level</label>
                      <select name="grade_level" className="settings-input form-select" value={formData.grade_level} onChange={handleChange}>
                         <option value="">Select Level</option>
                         <option value="J SS 2">J SS 2</option>
                         <option value="JSS 3">JSS 3</option>
                         <option value="SSS 1">SSS 1</option>
                      </select>
                    </div>
                  </>
                )}

                <div className="settings-form-group settings-form-full mt-3">
                  <h5 className="fw-bold mb-3 border-top pt-4">Security</h5>
                </div>

                <div className="settings-form-group">
                  <label className="settings-label">Current Password</label>
                  <div className="settings-input-icon-wrapper">
                    <i className="fas fa-key settings-input-icon" style={{ transform: 'scaleX(-1)' }}></i>
                    <input type={showCurrentPass ? 'text' : 'password'} name="currentPassword" className="settings-input settings-input-with-icon" placeholder="••••••••" value={formData.currentPassword} onChange={handleChange} />
                    <i className={`fas ${showCurrentPass ? 'fa-eye-slash' : 'fa-eye'} settings-input-icon-right`} onClick={() => setShowCurrentPass(!showCurrentPass)}></i>
                  </div>
                </div>
                
                <div className="settings-form-group">
                  <label className="settings-label">New Password</label>
                  <div className="settings-input-icon-wrapper">
                    <i className="fas fa-key settings-input-icon" style={{ transform: 'scaleX(-1)' }}></i>
                    <input type={showNewPass ? 'text' : 'password'} name="newPassword" className="settings-input settings-input-with-icon" placeholder="••••••••" value={formData.newPassword} onChange={handleChange} />
                    <i className={`fas ${showNewPass ? 'fa-eye-slash' : 'fa-eye'} settings-input-icon-right`} onClick={() => setShowNewPass(!showNewPass)}></i>
                  </div>
                </div>

                <div className="settings-form-group settings-form-full">
                  <label className="settings-label">Confirm New Password</label>
                  <div className="settings-input-icon-wrapper">
                    <i className="fas fa-key settings-input-icon" style={{ transform: 'scaleX(-1)' }}></i>
                    <input type={showConfirmPass ? 'text' : 'password'} name="confirmPassword" className="settings-input settings-input-with-icon" placeholder="••••••••" value={formData.confirmPassword} onChange={handleChange} />
                    <i className={`fas ${showConfirmPass ? 'fa-eye-slash' : 'fa-eye'} settings-input-icon-right`} onClick={() => setShowConfirmPass(!showConfirmPass)}></i>
                  </div>
                </div>

              </div>

              {/* Action Buttons */}
              <div className="settings-action-buttons mt-5 pt-3 border-top">
                <button className="btn-settings-cancel" onClick={handleCancel}>Cancel</button>
                <button className="btn-settings-save" onClick={handleSave} disabled={loading}>
                  {loading
                    ? <><span className="spinner-border spinner-border-sm me-2" role="status"></span>Saving...</>
                    : 'Save Changes'
                  }
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
