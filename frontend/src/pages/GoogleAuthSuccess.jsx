import { useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

const GoogleAuthSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const processedRef = useRef(false);
  const { googleLogin } = useAuth();

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      toast.error('Google login failed. Please try again.');
      setTimeout(() => { navigate('/login'); }, 2000);
      return;
    }

    if (token) {
      googleLogin(token);
      window.history.replaceState({}, document.title, window.location.pathname);
      toast.success('Logged in with Google successfully!');
      setTimeout(() => { navigate('/dashboard'); }, 1500);
    } else {
      navigate('/login');
    }
  }, [searchParams, googleLogin, navigate]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <Toaster position="top-center" />
      <div className="text-center">
        <div className="spinner-border text-primary mb-3" role="status"></div>
        <p className="text-secondary">Completing Google login...</p>
      </div>
    </div>
  );
};

export default GoogleAuthSuccess;
