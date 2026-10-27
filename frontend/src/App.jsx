import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';

// Pages
import Login from './pages/Login';
import Unauthorized from './pages/Unauthorized';
import NotFound from './pages/NotFound';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ExcelUpload from './pages/admin/ExcelUpload';
import ExcelPreview from './pages/admin/ExcelPreview';
import GenerateTimetable from './pages/admin/GenerateTimetable';
import CompleteTimetable from './pages/admin/CompleteTimetable';
import GroupTimetable from './pages/admin/GroupTimetable';
import SectionTimetable from './pages/admin/SectionTimetable';
import ConflictReport from './pages/admin/ConflictReport';
import ExportTimetable from './pages/admin/ExportTimetable';
import AiExplanation from './pages/admin/AiExplanation';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';
import MyTimetable from './pages/student/MyTimetable';
import TodaysClasses from './pages/student/TodaysClasses';
import MyGroup from './pages/student/MyGroup';
import MySubjects from './pages/student/MySubjects';

function ProtectedRoute({ children, allowedRole }) {
  const { user, token, loading } = useContext(AuthContext);

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: '#F8FAFC' }}>Loading session...</div>;
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Root Redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={<ProtectedRoute allowedRole="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/upload-excel" element={<ProtectedRoute allowedRole="admin"><ExcelUpload /></ProtectedRoute>} />
          <Route path="/admin/excel-preview" element={<ProtectedRoute allowedRole="admin"><ExcelPreview /></ProtectedRoute>} />
          <Route path="/admin/students" element={<ProtectedRoute allowedRole="admin"><ExcelPreview /></ProtectedRoute>} />
          <Route path="/admin/subjects" element={<ProtectedRoute allowedRole="admin"><ExcelPreview /></ProtectedRoute>} />
          <Route path="/admin/faculty" element={<ProtectedRoute allowedRole="admin"><ExcelPreview /></ProtectedRoute>} />
          <Route path="/admin/rooms" element={<ProtectedRoute allowedRole="admin"><ExcelPreview /></ProtectedRoute>} />
          <Route path="/admin/groups" element={<ProtectedRoute allowedRole="admin"><ExcelPreview /></ProtectedRoute>} />
          <Route path="/admin/timeslots" element={<ProtectedRoute allowedRole="admin"><ExcelPreview /></ProtectedRoute>} />
          <Route path="/admin/generate" element={<ProtectedRoute allowedRole="admin"><GenerateTimetable /></ProtectedRoute>} />
          <Route path="/admin/timetable/complete" element={<ProtectedRoute allowedRole="admin"><CompleteTimetable /></ProtectedRoute>} />
          <Route path="/admin/timetable/group" element={<Navigate to="/admin/timetable/complete" replace />} />
          <Route path="/admin/timetable/section" element={<ProtectedRoute allowedRole="admin"><SectionTimetable /></ProtectedRoute>} />
          <Route path="/admin/conflicts" element={<ProtectedRoute allowedRole="admin"><ConflictReport /></ProtectedRoute>} />
          <Route path="/admin/export" element={<ProtectedRoute allowedRole="admin"><ExportTimetable /></ProtectedRoute>} />
          <Route path="/admin/ai-explanation" element={<ProtectedRoute allowedRole="admin"><AiExplanation /></ProtectedRoute>} />

          {/* Student Routes */}
          <Route path="/student/dashboard" element={<ProtectedRoute allowedRole="student"><StudentDashboard /></ProtectedRoute>} />
          <Route path="/student/my-timetable" element={<ProtectedRoute allowedRole="student"><MyTimetable /></ProtectedRoute>} />
          <Route path="/student/today" element={<ProtectedRoute allowedRole="student"><TodaysClasses /></ProtectedRoute>} />
          <Route path="/student/group" element={<ProtectedRoute allowedRole="student"><MyGroup /></ProtectedRoute>} />
          <Route path="/student/subjects" element={<ProtectedRoute allowedRole="student"><MySubjects /></ProtectedRoute>} />
          <Route path="/student/ai-explanation" element={<Navigate to="/student/dashboard" replace />} />

          {/* Fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
