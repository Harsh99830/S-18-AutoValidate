import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth();

  // Auth context abhi localStorage se load ho raha hai — wait karo
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Loading...</div>
      </div>
    );
  }

  // No user — login pe bhejo
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Role mismatch — sahi dashboard pe bhejo
  if (role && user.role !== role) {
    const routes = {
      student: '/dashboard/student',
      tutor: '/dashboard/tutor',
      hod: '/dashboard/hod',
      dean: '/dashboard/dean',
      puamdin: '/dashboard/puamdin',
    };
    return <Navigate to={routes[user.role] || '/login'} replace />;
  }

  return children;
};

export default ProtectedRoute;
