import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { authService } from '../services/apiService';
import '../styles/AuthPages.css';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // Route protection logic
  useEffect(() => {
    // If not verified through OTP, kick back to login
    if (!location.state?.verified) {
      navigate('/login');
    }
  }, [location.state, navigate]);

  const handleReset = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Use the email and otp passed from the previous step
      await authService.resetPassword({ 
        email: location.state?.email,
        otp: location.state?.otp,
        newPassword: password 
      });
      
      toast.success('Password has been reset successfully!');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Prevent flicker during redirect
  if (!location.state?.verified) {
    return null;
  }

  return (
    <div className="auth-page-container">
      <Toaster position="top-center" reverseOrder={false} />
      <div className="auth-logo-top">
        <img src="/images/logo.png" alt="Recode" height="80" />
      </div>

      <div className="auth-card">
        <h1 className="auth-title">Set New Password</h1>
        <p className="auth-subtitle">
          Enter your new password below
        </p>

        <form className="auth-form" onSubmit={handleReset}>
          <div className="auth-form-group">
            <label className="auth-label">New password</label>
            <input 
              type="password" 
              className="auth-input" 
              placeholder="Enter your new password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="auth-form-group">
            <label className="auth-label">Confirm new password</label>
            <input 
              type="password" 
              className="auth-input" 
              placeholder="Confirm your new password" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <div className="auth-checkbox-group mb-4">
            <input type="checkbox" className="auth-checkbox" id="rememberMe" />
            <label htmlFor="rememberMe" className="small text-secondary">Remember me</label>
          </div>

          {error && <p className="text-danger small mb-3">{error}</p>}

          <button type="submit" className="btn-auth-submit" disabled={loading}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
