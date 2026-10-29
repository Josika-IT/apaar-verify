import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { AicteDashboard } from './pages/AicteDashboard';
import { InstitutionDashboard } from './pages/InstitutionDashboard';
import { StudentUpload } from './pages/StudentUpload';
import { StudentRecords } from './pages/StudentRecords';
import { ValidationResults } from './pages/ValidationResults';
import { AnomalyDetection } from './pages/AnomalyDetection';
import { VerificationPortal } from './pages/VerificationPortal';
import { ReportsPage } from './pages/ReportsPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { ApiDocsPage } from './pages/ApiDocsPage';

// Protected Route Component
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles?: string[];
}> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 text-sm">
        Authenticating session...
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If institution admin tries to access aicte-dashboard, redirect them to institution-dashboard
    if (user.role === 'institution_admin') {
      return <Navigate to="/institution-dashboard" replace />;
    } else if (user.role === 'verifier') {
      return <Navigate to="/verify" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/verify" element={<VerificationPortal />} />
          <Route path="/api-docs" element={<ApiDocsPage />} />

          {/* AICTE Admin Routes */}
          <Route
            path="/aicte-dashboard"
            element={
              <ProtectedRoute allowedRoles={['aicte_admin']}>
                <AicteDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/anomalies"
            element={
              <ProtectedRoute allowedRoles={['aicte_admin']}>
                <AnomalyDetection />
              </ProtectedRoute>
            }
          />
          <Route
            path="/audit"
            element={
              <ProtectedRoute allowedRoles={['aicte_admin']}>
                <AuditLogsPage />
              </ProtectedRoute>
            }
          />

          {/* Institution Admin & AICTE Admin Routes */}
          <Route
            path="/institution-dashboard"
            element={
              <ProtectedRoute allowedRoles={['aicte_admin', 'institution_admin']}>
                <InstitutionDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/upload"
            element={
              <ProtectedRoute allowedRoles={['aicte_admin', 'institution_admin']}>
                <StudentUpload />
              </ProtectedRoute>
            }
          />
          <Route
            path="/validation"
            element={
              <ProtectedRoute allowedRoles={['aicte_admin', 'institution_admin']}>
                <ValidationResults />
              </ProtectedRoute>
            }
          />

          {/* General Authenticated Routes */}
          <Route
            path="/records"
            element={
              <ProtectedRoute>
                <StudentRecords />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <ReportsPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
