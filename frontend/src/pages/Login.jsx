import React, { useState } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import '../styles/Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password
      });
      
      localStorage.setItem('token', response.data.token);
      toast.success(response.data.message || 'Logged in successfully!');
      
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
      
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Invalid credentials or something went wrong!';
      toast.error(errorMessage);
    }
  };

  return (
    <div className="login-page-container py-4 py-md-5">
      <Toaster position="top-center" reverseOrder={false} />
      
      <div className="container d-flex justify-content-center align-items-center">
        <div className="login-form-card bg-white p-4 p-md-5 rounded-4 border border-light-subtle shadow-soft w-100" style={{maxWidth: '480px'}}>
          <div className="text-center mb-4 mb-md-5">
            <h2 className="fw-bold text-dark mb-2 h3">Login</h2>
            <p className="text-secondary fs-7">Welcome back! Please log in to access your account.</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-3 mb-md-4">
              <label className="form-label fw-bold text-dark fs-7">Email</label>
              <input 
                type="email" 
                className="form-control login-input-field py-2 px-3 rounded-2 fs-7" 
                placeholder="Enter your Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>

            <div className="mb-2 mb-md-3">
              <label className="form-label fw-bold text-dark fs-7">Password</label>
              <input 
                type="password" 
                className="form-control login-input-field py-2 px-3 rounded-2 fs-7" 
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>

            <div className="text-end mb-3 mb-md-4">
              <a href="#" className="text-secondary text-decoration-none fs-7">Forgot Password?</a>
            </div>

            <div className="mb-3 mb-md-4 d-flex align-items-center gap-2">
              <input type="checkbox" className="form-check-input border-secondary-subtle small-check" id="remember" />
              <label className="form-check-label text-secondary fs-7" htmlFor="remember">Remember Me</label>
            </div>

            <button type="submit" className="btn btn-login-submit w-100 py-2 fw-bold rounded-2 mb-3 mb-md-4 fs-7">Login</button>

            <div className="d-flex align-items-center mb-3 mb-md-4">
              <hr className="flex-grow-1 border-secondary-subtle my-0" />
              <span className="px-3 text-secondary x-small fw-medium">OR</span>
              <hr className="flex-grow-1 border-secondary-subtle my-0" />
            </div>

            <button type="button" className="btn btn-social-login w-100 py-2 rounded-2 d-flex align-items-center justify-content-center gap-2 mb-4 mb-md-5 fs-7 border border-light-subtle">
              <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" width="18" height="18" alt="Google" />
              <span className="fw-medium text-dark">Login with Google</span>
            </button>

            <div className="text-center">
              <p className="text-dark mb-0 fs-7">Don’t have an account? <a href="/signup" className="text-dark fw-bold text-decoration-none ms-1">Sign Up <i className="fa-solid fa-arrow-right ms-1 x-small"></i></a></p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;