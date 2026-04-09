import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { authService, API_BASE } from '../services/apiService';
import '../styles/Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('verified') === 'true') {
      toast.success('Email verified successfully! You can now log in.', { duration: 4000 });
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (params.get('error') === 'invalid_or_expired_token') {
      toast.error('Verification link is invalid or expired. Please request a new one.');
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (params.get('error') === 'missing_token') {
      toast.error('Verification link is missing or corrupted.');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await authService.login({
        email,
        password
      });
      
      localStorage.setItem('token', response.data.token);
      toast.success(response.data.message || 'Logged in successfully!');
      
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
      
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="login-page-container">
      <Toaster position="top-center" reverseOrder={false} />
      
      <div className="login-logo-top">
         <img src="/images/logo.png" alt="Recode" height="80" />
      </div>

      <div className="login-card">
        <h1 className="login-title">Login</h1>
        <p className="login-subtitle">
          Enter your account details below to access your courses.
        </p>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-form-group">
            <label className="login-label">Email address</label>
            <input 
              type="email" 
              className="login-input" 
              placeholder="e.g kristen.watson@example.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="login-form-group">
            <div className="d-flex justify-content-between">
               <label className="login-label">Password</label>
               <Link to="/forgot-password-init" className="login-forgot-link">Forgot password?</Link>
            </div>
            <input 
              type="password" 
              className="login-input" 
              placeholder="Enter your password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="login-checkbox-group">
            <input type="checkbox" className="login-checkbox" id="rememberMe" />
            <label htmlFor="rememberMe" className="small text-secondary">Remember me</label>
          </div>

          <button type="submit" className="btn-login-submit">Login</button>

          <div className="d-flex align-items-center mb-4 mt-2">
            <hr className="flex-grow-1 border-secondary-subtle my-0" />
            <span className="px-3 text-secondary x-small fw-medium">OR</span>
            <hr className="flex-grow-1 border-secondary-subtle my-0" />
          </div>

          <button 
            type="button" 
            className="btn btn-social-login w-100 py-2 rounded-2 d-flex align-items-center justify-content-center gap-2 mb-4 mb-md-5 fs-7 border border-light-subtle"
            onClick={() => window.location.href = `${API_BASE}/auth/google`}
          >
            <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" width="18" height="18" alt="Google" />
            <span className="fw-medium text-dark">Login with Google</span>
          </button>

          <div className="text-center">
            <p className="text-dark mb-0 fs-7">Don't have an account? <Link to="/signup" className="text-dark fw-bold text-decoration-none">Sign up <i className="fa-solid fa-arrow-right ms-1 x-small"></i></Link></p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;