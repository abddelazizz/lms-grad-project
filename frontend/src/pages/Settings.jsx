import React, { useState, useEffect, useRef } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
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
  const { api, storeToken, user } = useAuth();
  const photoInputRef = useRef(null);

  // Security States
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [mfaStep, setMfaStep] = useState('none'); // none, setup, active
  const [mfaCode, setMfaCode] = useState('');
  const [sessions, setSessions] = useState([]);
  const [securityLoading, setSecurityLoading] = useState(false);
  const [isDisablingMFA, setIsDisablingMFA] = useState(false);
  const [disableFormData, setDisableFormData] = useState({ password: '', totpCode: '' });
  const [recoveryCodes, setRecoveryCodes] = useState([]);
  const [showRecoveryCodes, setShowRecoveryCodes] = useState(false);


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
    fetchSecurityStatus();
  }, []);

  const fetchSecurityStatus = async () => {
    try {
      setSecurityLoading(true);
      // Fetch MFA Status
      const userRes = await api.get('/students/profile');
      setMfaEnabled(userRes.data.data.mfa_enabled);
      setMfaStep(userRes.data.data.mfa_enabled ? 'active' : 'none');

      // Fetch Active Sessions
      const sessionsRes = await api.get('/auth/sessions');
      const sessionsData = sessionsRes.data.data;
      setSessions(sessionsData || []);
    } catch (error) {
      console.error('Security fetch error:', error);
    } finally {
      setSecurityLoading(false);
    }
  };

  const handleSetupMFA = async () => {
    try {
      setSecurityLoading(true);
      const res = await api.post('/mfa/setup');
      const setupData = res.data.data;
      setQrCode(setupData.qrCode);
      setMfaStep('setup');
      toast.success('Scan the QR code to proceed');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to setup MFA');
    } finally {
      setSecurityLoading(false);
    }
  };

  const handleVerifyMFA = async () => {
    try {
      setSecurityLoading(true);
      const res = await api.post('/mfa/verify-setup', { totpCode: mfaCode });
      setMfaEnabled(true);
      setMfaStep('active');
      setMfaCode('');
      
      if (res.data?.data?.recoveryCodes) {
        setRecoveryCodes(res.data.data.recoveryCodes);
        setShowRecoveryCodes(true);
      }
      
      toast.success('MFA enabled successfully!');
    } catch (error) {

      toast.error(error.response?.data?.message || 'Invalid code');
    } finally {
      setSecurityLoading(false);
    }
  };

  const handleDisableMFA = () => {
    setIsDisablingMFA(true);
  };

  const confirmDisableMFA = async (e) => {
    e.preventDefault();
    if (!disableFormData.password || !disableFormData.totpCode) {
      return toast.error('Please enter both password and verification code.');
    }

    try {
      setSecurityLoading(true);
      await api.post('/mfa/disable', { 
        password: disableFormData.password, 
        totpCode: disableFormData.totpCode 
      });
      setMfaEnabled(false);
      setMfaStep('none');
      setIsDisablingMFA(false);
      setDisableFormData({ password: '', totpCode: '' });
      toast.success('Two-factor authentication disabled.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to disable MFA. Check your password and code.');
    } finally {
      setSecurityLoading(false);
    }
  };


  const handleRevokeSession = async (tokenId) => {
    try {
      await api.delete(`/auth/sessions/${tokenId}`);
      setSessions(sessions.filter(s => s.id !== tokenId));
      toast.success('Session logged out');
    } catch (error) {
      toast.error('Failed to revoke session');
    }
  };

  const handleLogoutAll = async () => {
    try {
      setSecurityLoading(true);
      await api.delete('/auth/sessions');
      setSessions(sessions.filter(s => s.isCurrent));
      toast.success('All other sessions logged out');
    } catch (error) {
      toast.error('Failed to logout other devices');
    } finally {
      setSecurityLoading(false);
    }
  };


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
        ...(formData.firstName && formData.lastName && { name: `${formData.firstName} ${formData.lastName}`.trim() }),
        ...(formData.phone && { phone_number: formData.phone }),
        ...(formData.userName && { username: formData.userName }),
        ...(formData.newPassword && {
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
        // Send role specific data
        ...(formData.role === 'instructor' && {
           ...(formData.bio && { bio: formData.bio }),
           ...(formData.specialization && { specialization: formData.specialization })
        }),
        ...(formData.role === 'student' && {
           ...(formData.grade_level && { grade_level: formData.grade_level })
        }),
        // If they cleared the photo visually and have no file to upload, delete from DB
        ...((!avatarPreview && !avatarFile) && {
           picture: null
        }),
      };

      const response = await studentService.updateProfile(updatePayload);

      if (response?.data?.token) {
        storeToken(response.data.token);
      }

      if (avatarFile) {
        const photoForm = new FormData();
        photoForm.append('profile_picture', avatarFile);
        const photoResponse = await studentService.updatePhoto(photoForm);
        
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

  const getFriendlyDevice = (ua) => {
    if (!ua) return 'Unknown Device';
    if (ua.includes('iPhone')) return 'iPhone';
    if (ua.includes('Android')) return 'Android Phone';
    if (ua.includes('Windows')) return 'Windows PC';
    if (ua.includes('Macintosh')) return 'MacBook';
    if (ua.includes('Linux')) return 'Linux PC';
    return 'Desktop Device';
  };

  const getBrowser = (ua) => {
    if (!ua) return '';
    if (ua.includes('Edg/')) return 'Edge';
    if (ua.includes('Chrome/')) return 'Chrome';
    if (ua.includes('Safari/')) return 'Safari';
    if (ua.includes('Firefox/')) return 'Firefox';
    return '';
  };

  return (
    <div className="dashboard-page">
      <Toaster position="top-center" reverseOrder={false} />
      <div className="dashboard-layout">
        <Sidebar activePath="/dashboard/settings" />

        <div className="settings-main-content flex-grow-1">
          <div className="settings-content-wrapper pt-5 mt-4 mx-auto px-4">

            {/* Breadcrumb */}
            <div className="d-flex align-items-center gap-2 mb-4 animate__animated animate__fadeIn">
              <span className="settings-breadcrumb-item">Settings</span>
              <i className="fas fa-chevron-right settings-breadcrumb-arrow"></i>
              <span className="settings-breadcrumb-item text-capitalize">{formData.role || 'User'} Profile</span>
            </div>

            <div className="settings-card shadow-sm border-0 rounded-4 animate__animated animate__fadeInUp">
              <div className="d-flex justify-content-between align-items-center mb-5 pb-3 border-bottom">
                <div>
                  <h3 className="settings-title m-0">Account Details</h3>
                  <p className="text-muted small mb-0 mt-1">Manage your profile information and security settings</p>
                </div>
                {formData.role && (
                  <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-2 rounded-pill text-capitalize fw-bold border border-primary-subtle">
                    {formData.role} Account
                  </span>
                )}
              </div>

              {/* Profile Photo Section */}
              <div className="settings-photo-section mb-5">
                <div className="settings-avatar-wrapper">
                  <div
                    className="settings-avatar shadow-sm border border-2 border-white"
                    onClick={() => photoInputRef.current.click()}
                    style={{ cursor: 'pointer', width: '80px', height: '80px' }}
                  >
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Profile" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <i className="fas fa-user settings-avatar-icon"></i>
                    )}
                  </div>
                  <input type="file" ref={photoInputRef} onChange={handlePhotoChange} accept="image/*" style={{ display: 'none' }} />
                  <div>
                    <div className="settings-avatar-name mb-1">
                      {formData.firstName || formData.lastName ? `${formData.firstName} ${formData.lastName}`.trim() : 'Display Name'}
                    </div>
                    <div className="text-muted small">Update your profile picture</div>
                  </div>
                </div>
                <div className="settings-photo-actions">
                  <button className="btn-upload-photo" onClick={() => photoInputRef.current.click()}>Change Photo</button>
                  <button className="btn-delete-photo" onClick={handleDeletePhoto}>Remove</button>
                </div>
              </div>

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
                  <label className="settings-label">Username</label>
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
                    <input type="email" name="email" className="settings-input settings-input-with-icon bg-light" value={formData.email} disabled />
                  </div>
                  <small className="text-muted mt-1 d-block"><i className="fas fa-info-circle me-1"></i> Email cannot be changed</small>
                </div>

                {/* Role Specific Fields */}
                {formData.role === 'instructor' && (
                  <div className="settings-form-full mt-4">
                    <h6 className="fw-bold mb-3 border-top pt-4">Professional Information</h6>
                    <div className="settings-form-grid">
                      <div className="settings-form-group settings-form-full">
                        <label className="settings-label">Specialization</label>
                        <input type="text" name="specialization" className="settings-input" placeholder="e.g. Mathematics" value={formData.specialization} onChange={handleChange} />
                      </div>
                      <div className="settings-form-group settings-form-full">
                        <label className="settings-label">Bio</label>
                        <textarea name="bio" className="settings-input" rows="3" placeholder="Tell us about yourself..." value={formData.bio} onChange={handleChange}></textarea>
                      </div>
                    </div>
                  </div>
                )}

                {formData.role === 'student' && (
                  <div className="settings-form-full mt-4">
                    <h6 className="fw-bold mb-3 border-top pt-4">Academic Details</h6>
                    <div className="settings-form-group">
                      <label className="settings-label">Grade Level</label>
                      <select name="grade_level" className="settings-input form-select" value={formData.grade_level} onChange={handleChange}>
                        <option value="">Select Level</option>
                        <option value="J SS 2">J SS 2</option>
                        <option value="JSS 3">JSS 3</option>
                        <option value="SSS 1">SSS 1</option>
                      </select>
                    </div>
                  </div>
                )}

                <div className="settings-form-full mt-5">
                  <h6 className="fw-bold mb-4 border-top pt-4">Password & Security</h6>
                  <div className="settings-form-grid">
                    <div className="settings-form-group">
                      <label className="settings-label">Current Password</label>
                      <div className="settings-input-icon-wrapper">
                        <i className="fas fa-lock settings-input-icon"></i>
                        <input type={showCurrentPass ? 'text' : 'password'} name="currentPassword" className="settings-input settings-input-with-icon" placeholder="••••••••" value={formData.currentPassword} onChange={handleChange} />
                        <i className={`fas ${showCurrentPass ? 'fa-eye-slash' : 'fa-eye'} settings-input-icon-right`} onClick={() => setShowCurrentPass(!showCurrentPass)}></i>
                      </div>
                    </div>
                    <div className="settings-form-group">
                      <label className="settings-label">New Password</label>
                      <div className="settings-input-icon-wrapper">
                        <i className="fas fa-shield-alt settings-input-icon"></i>
                        <input type={showNewPass ? 'text' : 'password'} name="newPassword" className="settings-input settings-input-with-icon" placeholder="••••••••" value={formData.newPassword} onChange={handleChange} />
                        <i className={`fas ${showNewPass ? 'fa-eye-slash' : 'fa-eye'} settings-input-icon-right`} onClick={() => setShowNewPass(!showNewPass)}></i>
                      </div>
                    </div>
                    <div className="settings-form-group">
                      <label className="settings-label">Confirm New Password</label>
                      <div className="settings-input-icon-wrapper">
                        <i className="fas fa-shield-alt settings-input-icon"></i>
                        <input type={showConfirmPass ? 'text' : 'password'} name="confirmPassword" className="settings-input settings-input-with-icon" placeholder="••••••••" value={formData.confirmPassword} onChange={handleChange} />
                        <i className={`fas ${showConfirmPass ? 'fa-eye-slash' : 'fa-eye'} settings-input-icon-right`} onClick={() => setShowConfirmPass(!showConfirmPass)}></i>
                      </div>
                    </div>
                  </div>
                </div>

                {/* MFA Section */}
                <div className="settings-form-full mt-5">
                  <div className="mfa-card-wrapper">
                    <div className="mfa-card-header d-flex justify-content-between align-items-center">
                      <div className="hstack gap-3">
                        <div className="session-icon-box" style={{ background: '#eef2ff' }}>
                          <i className="fas fa-user-shield text-primary"></i>
                        </div>
                        <div>
                          <h6 className="fw-bold mb-0">Two-Factor Authentication</h6>
                          <p className="text-muted small mb-0">Add an extra layer of security to your account</p>
                        </div>
                      </div>
                      {mfaStep === 'active' ? (
                        <button className={`btn ${isDisablingMFA ? 'btn-light' : 'btn-outline-danger'} btn-sm rounded-pill px-3 fw-bold`} onClick={() => setIsDisablingMFA(!isDisablingMFA)}>
                          {isDisablingMFA ? 'Cancel' : 'Disable'}
                        </button>
                      ) : mfaStep === 'none' && (
                        <button className="btn btn-primary btn-sm rounded-pill px-3 fw-bold" onClick={handleSetupMFA}>Setup MFA</button>
                      )}
                    </div>

                    {isDisablingMFA && (
                      <div className="p-4 border-top bg-light bg-opacity-50 animate__animated animate__fadeIn">
                        <div className="row justify-content-center">
                          <div className="col-md-8">
                            <div className="text-center mb-4">
                              <h6 className="fw-bold text-danger mb-2">Disable Two-Factor Authentication</h6>
                              <p className="text-muted small">For your security, please verify your identity to continue.</p>
                            </div>
                            <form onSubmit={confirmDisableMFA}>
                              <div className="vstack gap-3">
                                <div>
                                  <label className="settings-label">Account Password</label>
                                  <input 
                                    type="password" 
                                    className="settings-input" 
                                    placeholder="Enter your password"
                                    value={disableFormData.password}
                                    onChange={(e) => setDisableFormData({...disableFormData, password: e.target.value})}
                                    required
                                  />
                                </div>
                                <div>
                                  <label className="settings-label">6-Digit App Code</label>
                                  <input 
                                    type="text" 
                                    className="form-control mfa-input-code" 
                                    placeholder="000000"
                                    maxLength="6"
                                    value={disableFormData.totpCode}
                                    onChange={(e) => setDisableFormData({...disableFormData, totpCode: e.target.value.replace(/\D/g, '')})}
                                    required
                                  />
                                </div>
                                <div className="pt-2">
                                  <button type="submit" className="btn btn-danger w-100 py-2 rounded-3 fw-bold" disabled={securityLoading}>
                                    {securityLoading ? <><i className="fas fa-spinner fa-spin me-2"></i>Processing...</> : 'Confirm Disablement'}
                                  </button>
                                </div>
                              </div>
                            </form>
                          </div>
                        </div>
                      </div>
                    )}

                    {mfaStep === 'setup' && (
                      <div className="mfa-setup-area animate__animated animate__fadeIn">
                        <div className="row justify-content-center align-items-center">
                          <div className="col-md-5">
                            <div className="mfa-qr-container">
                              {qrCode ? (
                                <img src={qrCode} alt="QR Code" style={{ width: '160px' }} />
                              ) : (
                                <div className="p-4"><i className="fas fa-spinner fa-spin"></i></div>
                              )}
                            </div>
                            <p className="text-muted small px-3">Scan this code in your authenticator app (Google Authenticator, Authy, etc.)</p>
                          </div>
                          <div className="col-md-5 border-start">
                            <div className="px-3">
                              <label className="settings-label d-block mb-3">Verification Code</label>
                              <input
                                type="text"
                                className="form-control mfa-input-code mb-3"
                                placeholder="000000"
                                maxLength="6"
                                value={mfaCode}
                                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                              />
                              <button className="btn btn-primary w-100 py-2 rounded-3 fw-bold" onClick={handleVerifyMFA} disabled={securityLoading}>
                                {securityLoading ? <i className="fas fa-spinner fa-spin"></i> : 'Verify & Enable'}
                              </button>
                              <button className="btn btn-link btn-sm w-100 text-muted mt-2" onClick={() => setMfaStep('none')}>Cancel</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {mfaStep === 'active' && (
                      <div className="p-4 bg-success bg-opacity-10 border-top border-success border-opacity-10">
                        <div className="d-flex align-items-center justify-content-between text-success">
                          <div className="d-flex align-items-center gap-3">
                            <i className="fas fa-check-circle fs-5"></i>
                            <span className="small fw-bold">MFA is currently enabled on your account.</span>
                          </div>
                          {recoveryCodes.length > 0 && (
                            <button className="btn btn-success btn-sm rounded-pill px-3 fw-bold" onClick={() => setShowRecoveryCodes(true)}>
                              View Recovery Codes
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Recovery Codes Modal-like Overlay */}
                    {showRecoveryCodes && (
                      <div className="recovery-codes-overlay p-4 border-top animate__animated animate__fadeIn">
                        <div className="text-center mb-4">
                          <div className="bg-warning bg-opacity-10 text-warning d-inline-block p-3 rounded-circle mb-3">
                            <i className="fas fa-exclamation-triangle fs-4"></i>
                          </div>
                          <h6 className="fw-bold">Your Recovery Codes</h6>
                          <p className="text-muted small">Save these codes in a safe place. You can use them to access your account if you lose your phone.</p>
                        </div>
                        <div className="recovery-codes-grid mb-4">
                          {recoveryCodes.map((code, idx) => (
                            <div key={idx} className="recovery-code-item">
                              <code>{code}</code>
                            </div>
                          ))}
                        </div>
                        <div className="d-flex gap-2">
                          <button 
                            className="btn btn-outline-primary flex-grow-1 fw-bold rounded-3" 
                            onClick={() => {
                              navigator.clipboard.writeText(recoveryCodes.join('\n'));
                              toast.success('Codes copied to clipboard');
                            }}
                          >
                            <i className="fas fa-copy me-2"></i>Copy All
                          </button>
                          <button className="btn btn-primary flex-grow-1 fw-bold rounded-3" onClick={() => setShowRecoveryCodes(false)}>
                            Done
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sessions Section */}
                <div className="settings-form-full mt-5">
                  <h6 className="fw-bold mb-4 border-top pt-4 hstack gap-2 justify-content-between">
                    <div className="hstack gap-2">
                      <i className="fas fa-history text-primary"></i> Active Sessions
                    </div>
                    {sessions.length > 1 && (
                      <button className="btn btn-link text-danger text-decoration-none small p-0" onClick={handleLogoutAll} disabled={securityLoading}>
                        Logout all other devices
                      </button>
                    )}
                  </h6>
                  <div className="vstack gap-3">
                    {sessions.length > 0 ? sessions.map((session) => (
                      <div key={session.tokenId} className="session-item">
                        <div className="hstack gap-3">
                          <div className="session-icon-box">
                            <i className={`fas ${session.deviceInfo?.agent?.includes('Mobile') ? 'fa-mobile-alt' : 'fa-laptop'}`}></i>
                          </div>
                          <div className="session-info">
                            <div className="session-device">
                              {getFriendlyDevice(session.deviceInfo?.agent || session.deviceInfo?.userAgent)}
                              {getBrowser(session.deviceInfo?.agent || session.deviceInfo?.userAgent) && ` • ${getBrowser(session.deviceInfo?.agent || session.deviceInfo?.userAgent)}`}
                            </div>
                            <div className="session-meta">
                              {session.ipAddress} • {new Date(session.createdAt).toLocaleDateString()} at {new Date(session.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                        <div className="hstack gap-3">
                          {session.isCurrent && <span className="badge-current-session">Current Session</span>}
                          {!session.isCurrent && (
                            <button className="btn btn-outline-danger btn-sm btn-revoke" onClick={() => handleRevokeSession(session.tokenId)}>Logout</button>
                          )}
                        </div>
                      </div>
                    )) : (
                      <div className="text-center py-4 border rounded-4 bg-light bg-opacity-50">
                        <p className="text-muted small mb-0">No other active sessions found.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div> {/* End settings-form-grid */}

              {/* Action Buttons */}
              <div className="settings-action-buttons mt-5 pt-4 border-top">
                <button className="btn-settings-cancel" onClick={handleCancel}>Cancel Changes</button>
                <button className="btn-settings-save" onClick={handleSave} disabled={loading}>
                  {loading ? (
                    <><span className="spinner-border spinner-border-sm me-2" role="status"></span>Saving...</>
                  ) : (
                    'Save Profile'
                  )}
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
