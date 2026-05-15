import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import AuthCallback from './pages/AuthCallback.jsx';
import StudentDashboard from './pages/StudentDashboard.jsx';
import TutorDashboard from './pages/TutorDashboard.jsx';
import HODDashboard from './pages/HODDashboard.jsx';
import DeanDashboard from './pages/DeanDashboard.jsx';
import PuamdinDashboard from './pages/PuamdinDashboard.jsx';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/auth/callback" element={<AuthCallback />} />

      <Route path="/dashboard/student" element={<ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>} />
      <Route path="/dashboard/tutor"   element={<ProtectedRoute role="tutor"><TutorDashboard /></ProtectedRoute>} />
      <Route path="/dashboard/hod"     element={<ProtectedRoute role="hod"><HODDashboard /></ProtectedRoute>} />
      <Route path="/dashboard/dean"    element={<ProtectedRoute role="dean"><DeanDashboard /></ProtectedRoute>} />

      {/* Admin — publicly accessible */}
      <Route path="/dashboard/admin" element={<PuamdinDashboard />} />

      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
