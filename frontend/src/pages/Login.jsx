import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Login.css';


const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaData, setMfaData] = useState({ userId: null, tempToken: null });
  const [totpCode, setTotpCode] = useState('');
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState('');
  const { login, loginWithMFA, isAuthenticated, api } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);


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
      const result = await login({ email, password });

      if (result.mfaRequired) {
        setMfaRequired(true);
        setMfaData({ userId: result.userId, tempToken: result.tempToken });
        toast('MFA verification required.',);
        return;
      }

      toast.success(result.message || 'Logged in successfully!');
      setTimeout(() => { window.location.href = '/'; }, 1500);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Please check your credentials.');
    }
  };

  const handleMFAVerify = async (e) => {
    e.preventDefault();
    try {
      const result = await loginWithMFA(mfaData.userId, totpCode, mfaData.tempToken);
      toast.success(result.message || 'MFA verified. Logged in successfully!');
      setTimeout(() => { window.location.href = '/'; }, 1500);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid verification code.');
    }
  };

  const handleMFARecover = async (e) => {
    e.preventDefault();
    if (!recoveryCode) return toast.error('Please enter a recovery code.');
    try {
      const response = await api.post('/mfa/recover', { recoveryCode, userId: mfaData.userId });
      toast.success('Access recovered! Please login normally.');
      setMfaRequired(false);
      setShowRecovery(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid recovery code.');
    }
  };

  if (mfaRequired) {
    return (
      <div className="login-page-container animate__animated animate__fadeIn">
        <Toaster position="top-center" reverseOrder={false} />
        <div className="login-logo-top">
          <img src="/images/logo.png" alt="Recode" height="80" />
        </div>
        <div className="login-card shadow-lg">
          <div className="text-center mb-4">
            <div className="mfa-icon-wrapper mx-auto mb-3">
              <i className="fas fa-user-shield text-primary fa-2x"></i>
            </div>
            <h1 className="login-title h3 fw-bold">Two-Step Verification</h1>
            <p className="login-subtitle px-2">Enter the 6-digit code from your authenticator app to secure your session.</p>
          </div>

          <form className="login-form" onSubmit={showRecovery ? handleMFARecover : handleMFAVerify}>
            <div className="login-form-group">
              <label className="login-label text-center d-block mb-3">
                {showRecovery ? '8-Character Recovery Code' : '6-Digit Verification Code'}
              </label>
              <input
                type="text"
                className="login-input mfa-input-field text-center fw-bold"
                placeholder={showRecovery ? "XXXX-XXXX" : "000 000"}
                value={showRecovery ? recoveryCode : totpCode}
                onChange={(e) => showRecovery ? setRecoveryCode(e.target.value) : setTotpCode(e.target.value.replace(/\D/g, ''))}
                required
                maxLength={showRecovery ? 12 : 6}
                style={{ fontSize: '1.2rem', letterSpacing: showRecovery ? '0.1rem' : '0.5rem' }}
              />
            </div>
            <button type="submit" className="btn-login-submit d-flex align-items-center justify-content-center gap-2">
              <i className={`fas ${showRecovery ? 'fa-key' : 'fa-unlock-alt'} small`}></i>
              <span>{showRecovery ? 'Recover Access' : 'Verify & Authenticate'}</span>
            </button>
            <div className="text-center mt-3">
              <button type="button" className="btn btn-link text-primary small text-decoration-none fw-bold" onClick={() => setShowRecovery(!showRecovery)}>
                {showRecovery ? 'Back to App Code' : 'Lost your device? Use a recovery code'}
              </button>
            </div>
            <button type="button" className="btn btn-link w-100 text-muted small text-decoration-none mt-2" onClick={() => setMfaRequired(false)}>
              Cancel and go back
            </button>
          </form>
        </div>
      </div>
    );
  }


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
              <Link to="/forgot-password" style={{ fontSize: '12px' }} className="login-forgot-link">Forgot password?</Link>
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
            onClick={() => window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/google`}
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
