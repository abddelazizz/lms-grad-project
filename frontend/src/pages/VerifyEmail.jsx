import React, { useEffect, useState, useRef } from 'react'; // ضفنا useRef
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import '../styles/Login.css';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('loading'); 
  const [message, setMessage] = useState('');
  
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link.');
      return;
    }

    if (hasFetched.current) return;
    hasFetched.current = true; 

    const verifyAccount = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/auth/verify-email?token=${token}`);
        setStatus('success');
        setMessage(response.data.message || 'Account verified successfully!');
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Verification failed or link expired.');
      }
    };

    setTimeout(() => {
      verifyAccount();
    }, 1000);
  }, [token]);

  return (
    <div className="login-page-container py-5 d-flex align-items-center justify-content-center" style={{ minHeight: '80vh' }}>
      <div className="container d-flex justify-content-center">
        <div className="bg-white p-5 rounded-4 border border-light-subtle shadow-soft text-center w-100" style={{ maxWidth: '500px' }}>
          
          {status === 'loading' && (
            <div className="py-4">
              <div className="spinner-border text-warning mb-4" role="status" style={{ width: '3.5rem', height: '3.5rem', borderWidth: '0.25em' }}>
                <span className="visually-hidden">Loading...</span>
              </div>
              <h2 className="fw-bold text-dark mb-3 h4">Verifying your email...</h2>
              <p className="text-secondary fs-6 mb-0">Please wait a moment, we are setting up your account.</p>
            </div>
          )}

          {status === 'success' && (
            <div className="py-3">
              <div className="mb-4">
                <i className="fa-solid fa-circle-check text-success" style={{ fontSize: '5rem' }}></i>
              </div>
              <h2 className="fw-bold text-dark mb-3 h3">Awesome!</h2>
              <p className="text-secondary fs-6 mb-5 lh-lg">{message}</p>
              <Link to="/login" className="btn btn-login-submit w-100 py-3 fw-bold rounded-3 fs-6">
                Continue to Login <i className="fa-solid fa-arrow-right ms-2"></i>
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="py-3">
              <div className="mb-4">
                <i className="fa-solid fa-circle-xmark text-danger" style={{ fontSize: '5rem' }}></i>
              </div>
              <h2 className="fw-bold text-dark mb-3 h3">Oops!</h2>
              <p className="text-secondary fs-6 mb-5 lh-lg">{message}</p>
              <Link to="/signup" className="btn btn-social-login w-100 py-3 fw-bold rounded-3 fs-6 border border-light-subtle">
                Try Signing Up Again
              </Link>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;