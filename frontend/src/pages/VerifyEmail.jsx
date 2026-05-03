import React, { useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { authService } from '../services/apiService';
import '../styles/Login.css'; 

const VerifyEmail = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const inputRefs = useRef([]);

  const handleChange = (e, index) => {
    const value = e.target.value;
    if (isNaN(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value !== '' && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    // Auto-focus prev input on backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6).replace(/[^0-9]/g, '');
    if (pastedData.length > 0) {
      const newOtp = [...otp];
      for (let i = 0; i < pastedData.length; i++) {
        newOtp[i] = pastedData[i];
      }
      setOtp(newOtp);
      // Focus the next empty block or the last block
      const nextEmptyIndex = pastedData.length < 6 ? pastedData.length : 5;
      inputRefs.current[nextEmptyIndex].focus();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const otpValue = otp.join('');
    if (otpValue.length < 6) {
       return toast.error("Please enter the complete 6-digit OTP.");
    }

    setLoading(true);

    try {
      await authService.verifyResetOTP({
        email: location.state?.email,
        otp: otpValue,
      });

      toast.success('Verification successful!');
      setTimeout(() => {
        navigate('/reset-password', {
          state: {
            verified: true,
            email: location.state?.email,
            otp: otpValue,
          },
        });
      }, 1500);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed. Please check your code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-container py-4 py-md-5">
      <Toaster position="top-center" reverseOrder={false} />

      <div className="container d-flex justify-content-center align-items-center" style={{ minHeight: '70vh' }}>
        <div className="login-form-card bg-white p-4 p-md-5 rounded-4 border border-light-subtle shadow-soft w-100" style={{maxWidth: '480px'}}>
          <div className="text-center mb-4 mb-md-5">
            <h2 className="fw-bold text-dark mb-2 h3">Enter OTP</h2>
            <p className="text-secondary fs-7">
              A verification code has been sent to <span className="fw-bold text-dark">{location.state?.email || 'your email'}</span>. Please enter it below.
            </p>
          </div>

          <form onSubmit={handleVerify}>
            <div className="mb-4 d-flex justify-content-between gap-2">
              {otp.map((data, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength="1"
                  className="form-control text-center py-3 rounded-3 fw-bold fs-5"
                  style={{ width: '50px', backgroundColor: '#f8f9fa', border: '1px solid #dee2e6' }}
                  value={data}
                  onChange={(e) => handleChange(e, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  onPaste={handlePaste}
                  ref={(el) => inputRefs.current[index] = el}
                  required
                />
              ))}
            </div>

            <button type="submit" className="btn btn-login-submit w-100 py-2 fw-bold rounded-2 mb-4 fs-7" disabled={loading}>
              {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : 'Verify Code'}
            </button>

            <div className="text-center">
               <span className="text-secondary fs-7 px-2">OR</span>
            </div>

            <div className="text-center mt-4">
              <p className="text-dark mb-0 fs-7">Don't receive the email? <Link to="#" className="text-dark fw-bold text-decoration-none ms-1">Resend code</Link></p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;