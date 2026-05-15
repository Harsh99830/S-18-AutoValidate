import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleConfig = (role) => {
    switch (role?.toLowerCase()) {
      case 'student':
        return { bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.3)', text: '#93C5FD' };
      case 'tutor':
        return { bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.3)', text: '#6EE7B7' };
      case 'hod':
        return { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)', text: '#FCD34D' };
      default:
        return { bg: 'rgba(255,255,255,0.1)', border: 'rgba(255,255,255,0.2)', text: '#E5E7EB' };
    }
  };

  const roleConfig = user ? getRoleConfig(user.role) : null;

  return (
    <nav 
      className="sticky top-0 w-[96%] max-w-[1140px] mx-auto z-50 flex items-center justify-between px-6 rounded-b-3xl"
      style={{
        height: '60px',
        background: 'rgba(15, 13, 35, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
      }}
    >
      {/* LEFT SIDE — Branding */}
      <div className="flex items-center">
        <img 
          src="https://upload.wikimedia.org/wikipedia/en/f/f4/Poornima_University.png" 
          alt="PU Logo" 
          className="object-cover rounded-full ring-1 ring-white/10"
          style={{ width: 36, height: 36 }}
        />
        
        <div className="w-px mx-4" style={{ height: '28px', background: 'rgba(255,255,255,0.1)' }}></div>
        
        <div className="flex flex-col justify-center">
          <span className="text-white font-bold leading-none mb-1" style={{ fontSize: '16px' }}>
            S18 Portal
          </span>
          <span className="uppercase tracking-widest leading-none" style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)' }}>
            Poornima University
          </span>
        </div>
      </div>

      {/* CENTER — Role Badge */}
      <div className="absolute left-1/2 transform -translate-x-1/2 hidden md:flex">
        {user && user.role && (
          <div 
            className="flex items-center gap-2 rounded-full px-3 py-1"
            style={{ 
              background: roleConfig.bg, 
              border: `1px solid ${roleConfig.border}` 
            }}
          >
            <div 
              className="w-1.5 h-1.5 rounded-full animate-pulse" 
              style={{ background: roleConfig.text }}
            ></div>
            <span 
              className="uppercase tracking-wider font-semibold"
              style={{ fontSize: '11px', color: roleConfig.text }}
            >
              {user.role.replace('_', ' ')}
            </span>
          </div>
        )}
      </div>

      {/* RIGHT SIDE — User Info & Logout */}
      <div className="flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-3">
            <span className="font-semibold hidden sm:inline-block" style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>
              {user.name}
            </span>
            <div 
              className="rounded-full flex items-center justify-center text-white font-bold text-sm"
              style={{ 
                width: 32, height: 32, 
                background: 'rgba(255,255,255,0.1)', 
                border: '1px solid rgba(255,255,255,0.15)' 
              }}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
          </div>
        )}
        
        <button
          onClick={handleLogout}
          className="flex items-center justify-center rounded-full transition-all duration-200 group"
          style={{ width: 28, height: 28 }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
            e.currentTarget.querySelector('svg').style.stroke = 'rgba(239,68,68,0.8)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.querySelector('svg').style.stroke = 'rgba(255,255,255,0.4)';
          }}
          title="Logout"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="15" 
            height="15" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="rgba(255,255,255,0.4)" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            style={{ transition: 'stroke 0.2s' }}
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
