import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { authService, API_BASE } from '../services/apiService';
import '../styles/Signup.css';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [showResend, setShowResend] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [isResending, setIsResending] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setShowResend(false); 
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation: Check if passwords match
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    setShowResend(false);
    
    try {
      // Send only necessary data to the backend
      const { name, username, email, password } = formData;
      const payload = {
        name,
        email,
        password,
        ...(username ? { username } : {}),
      };
      const response = await authService.signup(payload);
      toast.success(response.data.message);
      
      setTimeout(() => {
        window.location.href = '/login';
      }, 2500);
      
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Something went wrong!';
      
      if (errorMessage === "Email already registered but not verified.") {
        setUnverifiedEmail(formData.email);
        setShowResend(true);
        toast.error("Account exists but is not verified.");
      } else {
        toast.error(errorMessage);
      }
    }
  };

  const handleResendVerification = async () => {
    setIsResending(true);
    try {
      const response = await authService.resendVerification(unverifiedEmail);
      toast.success(response.data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend email.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="signup-page-container py-4 py-md-5">
      <Toaster position="top-center" reverseOrder={false} />
      <div className="container d-flex justify-content-center align-items-center">
        <div className="signup-form-card bg-white p-4 p-md-5 rounded-4 border border-light-subtle shadow-soft w-100" style={{maxWidth: '480px'}}>
          <div className="text-center mb-4 mb-md-5">
            <h2 className="fw-bold text-dark mb-2 h3">Sign Up</h2>
            <p className="text-secondary fs-7">Create your account to start learning today.</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label fw-bold text-dark fs-7">Full Name</label>
              <input 
                type="text" 
                name="name"
                className="form-control signup-input-field py-2 px-3 rounded-2 fs-7" 
                placeholder="Enter your Name"
                value={formData.name}
                onChange={handleChange}
                required 
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-bold text-dark fs-7">User Name (Optional)</label>
              <input 
                type="text" 
                name="username"
                className="form-control signup-input-field py-2 px-3 rounded-2 fs-7" 
                placeholder="e.g. alaa.mohamed"
                value={formData.username}
                onChange={handleChange}
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-bold text-dark fs-7">Email</label>
              <input 
                type="email" 
                name="email"
                className="form-control signup-input-field py-2 px-3 rounded-2 fs-7" 
                placeholder="Enter your Email"
                value={formData.email}
                onChange={handleChange}
                required 
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-bold text-dark fs-7">Password</label>
              <input 
                type="password" 
                name="password"
                className="form-control signup-input-field py-2 px-3 rounded-2 fs-7" 
                placeholder="Enter your Password"
                value={formData.password}
                onChange={handleChange}
                required 
              />
            </div>

            <div className="mb-4">
              <label className="form-label fw-bold text-dark fs-7">Confirm Password</label>
              <input 
                type="password" 
                name="confirmPassword"
                className="form-control signup-input-field py-2 px-3 rounded-2 fs-7" 
                placeholder="Confirm your Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required 
              />
            </div>

            <button type="submit" className="btn btn-signup-submit w-100 py-2 fw-bold rounded-2 mb-3 fs-7">Sign Up</button>

            {showResend && (
              <div className="mb-4 p-3 bg-light-custom border border-warning-subtle rounded-3 text-center">
                <p className="text-dark fs-7 mb-2 fw-medium">Didn't receive the verification email?</p>
                <button 
                  type="button" 
                  onClick={handleResendVerification} 
                  disabled={isResending}
                  className="btn btn-outline-warning w-100 py-2 fs-7 fw-bold"
                >
                  {isResending ? 'Sending...' : 'Resend Verification Email'}
                </button>
              </div>
            )}

            <div className="d-flex align-items-center mb-3 mt-4">
              <hr className="flex-grow-1 border-secondary-subtle my-0" />
              <span className="px-3 text-secondary x-small fw-medium">OR</span>
              <hr className="flex-grow-1 border-secondary-subtle my-0" />
            </div>

            <button 
              type="button" 
              className="btn btn-social-signup w-100 py-2 rounded-2 d-flex align-items-center justify-content-center gap-2 mb-4 mb-md-5 fs-7 border border-light-subtle"
              onClick={() => window.location.href = `${API_BASE}/auth/google`}
            >
              <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" width="18" height="18" alt="Google" />
              <span className="fw-medium text-dark">Sign Up with Google</span>
            </button>

            <div className="text-center">
              <p className="text-dark mb-0 fs-7">Already have an account? <Link to="/login" className="text-dark fw-bold text-decoration-none ms-1">Login <i className="fa-solid fa-arrow-right ms-1 x-small"></i></Link></p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;
