import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';

const GoogleAuthSuccess = () => {
  const [searchParams] = useSearchParams();
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      toast.error('Google login failed. Please try again.');
      setTimeout(() => { window.location.href = '/login'; }, 2000);
      return;
    }

    if (token) {
      localStorage.setItem('token', token);
      toast.success('Logged in with Google successfully!');
      setTimeout(() => { window.location.href = '/dashboard'; }, 1500);
    } else {
      window.location.href = '/login';
    }
  }, [searchParams]);

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
