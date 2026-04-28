import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { authService } from '../services/apiService';
import '../styles/Login.css'; // Reuse Login styles for consistency

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (email) {
      try {
        await authService.forgotPassword(email);
        toast.success('OTP sent to your email!');
        setTimeout(() => {
          navigate('/verify-email', { state: { email, from: 'forgot-password' } });
        }, 1500);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to send OTP. Please try again.');
      }
    }
  };

  return (
    <div className="login-page-container py-4 py-md-5">
      <Toaster position="top-center" reverseOrder={false} />
      
      <div className="container d-flex justify-content-center align-items-center" style={{ minHeight: '70vh' }}>
        <div className="login-form-card bg-white p-4 p-md-5 rounded-4 border border-light-subtle shadow-soft w-100" style={{maxWidth: '480px'}}>
          <div className="text-center mb-4 mb-md-5">
            <h2 className="fw-bold text-dark mb-2 h3">Forgot Password?</h2>
            <p className="text-secondary fs-7">Enter your email and we'll send you an OTP to reset your password.</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="form-label fw-bold text-dark fs-7">Email Address</label>
              <input 
                type="email" 
                className="form-control login-input-field py-2 px-3 rounded-2 fs-7" 
                placeholder="Enter your Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>

            <button type="submit" className="btn btn-login-submit w-100 py-2 fw-bold rounded-2 mb-4 fs-7">Send OTP</button>

            <div className="text-center">
              <p className="text-dark mb-0 fs-7">Remember your password? <Link to="/login" className="text-dark fw-bold text-decoration-none ms-1">Login <i className="fa-solid fa-arrow-right ms-1 x-small"></i></Link></p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
