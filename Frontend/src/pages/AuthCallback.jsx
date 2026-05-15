import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const processed = useRef(false);

  useEffect(() => {
    // Prevent double-run in React StrictMode
    if (processed.current) return;
    processed.current = true;

    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const userRaw = params.get('user');
    const error = params.get('error');

    if (error) {
      const msgs = {
        invalid_domain: 'Sirf @poornima.edu.in email allowed hai.',
        google_denied: 'Google login cancel kar diya.',
        token_failed: 'Authentication fail ho gayi. Dobara try karo.',
        server_error: 'Server error. Thodi der baad try karo.',
        auth_failed: 'Google login fail hua. Dobara try karo.',
      };
      navigate(`/login?error=${encodeURIComponent(msgs[error] || 'Kuch galat hua.')}`, { replace: true });
      return;
    }

    if (token && userRaw) {
      try {
        const user = JSON.parse(decodeURIComponent(userRaw));

        // Pehle localStorage mein save karo DIRECTLY
        // (login() bhi yahi karta hai, but hum race condition avoid kar rahe hain)
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));

        // Ab AuthContext ko bhi update karo
        login(user, token);

        const routes = {
          student: '/dashboard/student',
          tutor: '/dashboard/tutor',
          hod: '/dashboard/hod',
          chief_proctor: '/dashboard/proctor',
        };

        const dest = routes[user.role] || '/dashboard/student';

        // Small timeout — React state settle hone do
        setTimeout(() => {
          navigate(dest, { replace: true });
        }, 100);

      } catch {
        navigate('/login?error=Kuch+galat+hua', { replace: true });
      }
    } else {
      navigate('/login', { replace: true });
    }
  }, [login, navigate]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: '12px' }}>
      <div style={{
        width: '32px', height: '32px', border: '3px solid #e5e7eb',
        borderTop: '3px solid #6366f1', borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ color: '#6b7280', fontSize: '14px' }}>Login ho raha hai...</p>
    </div>
  );
};

export default AuthCallback;
