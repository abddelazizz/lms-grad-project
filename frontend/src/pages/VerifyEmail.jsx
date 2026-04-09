import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { authService } from '../services/apiService';
import '../styles/AuthPages.css';

const VerifyEmail = () => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const isFromForgotPassword = location.state?.from === 'forgot-password';

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isFromForgotPassword) {
        await authService.verifyResetOTP({ 
          email: location.state?.email, 
          otp 
        });
        
        toast.success('Verification successful!');
        setTimeout(() => {
          navigate('/reset-password', { 
            state: { 
              verified: true, 
              email: location.state?.email, 
              otp 
            } 
          });
        }, 1500);
      } else {
        await authService.verifyOTP(otp);
        toast.success('Verification successful!');
        setTimeout(() => {
          navigate('/login');
        }, 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed. Please check your code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <Toaster position="top-center" reverseOrder={false} />
      <div className="auth-logo-top">
        <img src="/images/logo.png" alt="Recode" height="80" />
      </div>

      <div className="auth-card">
        <h1 className="auth-title">Enter OTP</h1>
        <p className="auth-subtitle">
          A verification code has been sent to your email. Please enter it below.
        </p>

        <form className="auth-form" onSubmit={handleVerify}>
          <div className="auth-form-group">
            <label className="auth-label">OTP Code</label>
            <input 
              type="text" 
              className="auth-input" 
              placeholder="Enter your 6-digit code" 
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
            />
          </div>

          {error && <p className="text-danger small mb-3">{error}</p>}

          <button type="submit" className="btn-auth-submit" disabled={loading}>
            {loading ? 'Verifying...' : 'Verify Code'}
          </button>
        </form>

        <div className="auth-footer-link">
          OR <br /><br />
          Don't receive the email? <Link to="#">resend code <i className="fas fa-external-link-alt"></i></Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;