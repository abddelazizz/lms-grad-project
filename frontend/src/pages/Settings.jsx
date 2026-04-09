import React, { useState, useEffect, useRef } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import Sidebar from '../components/Sidebar';
import { studentService } from '../services/apiService';
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
  });

  // Fetch real profile data from the backend on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await studentService.getProfile();
        const userData = response.data.data;
        if (userData) {
          const nameParts = (userData.name || '').split(' ');
          setFormData(prev => ({
            ...prev,
            firstName: nameParts[0] || '',
            lastName: nameParts.slice(1).join(' ') || '',
            email: userData.email || '',
            userName: userData.username || '',
            phone: userData.phone_number || '',
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

    const token = localStorage.getItem('token');
    if (!token) return toast.error('You must be logged in to save changes.');

    setLoading(true);
    try {
      const updatePayload = {
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email,
        phone_number: formData.phone,
        username: formData.userName,
        ...(formData.newPassword && {
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      };

      await studentService.updateProfile(updatePayload);

      if (avatarFile) {
        const photoForm = new FormData();
        photoForm.append('profile_picture', avatarFile);
        await studentService.updatePhoto(photoForm);
      }

      toast.success('Profile updated successfully!');
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
        <Sidebar activePath="/settings" />

        <div className="settings-main-content flex-grow-1 p-4">
          <div className="settings-content-wrapper pt-5 mt-4 mx-auto">

            {/* Breadcrumb */}
            <div className="d-flex align-items-center gap-2 mb-4">
              <span className="settings-breadcrumb-item">Setting</span>
              <i className="fas fa-chevron-right settings-breadcrumb-arrow"></i>
              <i className="fas fa-chevron-right settings-breadcrumb-arrow"></i>
              <span className="settings-breadcrumb-item">User Profile</span>
            </div>

            <div className="settings-card">

              <h3 className="settings-title">User Profile</h3>

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

                <div className="settings-form-group settings-form-full">
                  <label className="settings-label">User Name</label>
                  <input type="text" name="userName" className="settings-input" placeholder="eg. alaa.mohamed" value={formData.userName} onChange={handleChange} />
                </div>

                <div className="settings-form-group">
                  <label className="settings-label">Email Address</label>
                  <div className="settings-input-icon-wrapper">
                    <i className="fas fa-envelope settings-input-icon"></i>
                    <input type="email" name="email" className="settings-input settings-input-with-icon" value={formData.email} onChange={handleChange} />
                  </div>
                </div>
                <div className="settings-form-group">
                  <label className="settings-label">Phone Number</label>
                  <div className="settings-input-icon-wrapper">
                    <i className="fas fa-mobile-alt settings-input-icon"></i>
                    <input type="tel" name="phone" className="settings-input settings-input-with-icon" value={formData.phone} onChange={handleChange} />
                  </div>
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
              <div className="settings-action-buttons">
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
