import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth-store";
import ErrorBoundary from "@/components/ui/ErrorBoundary";

import MainLayout    from "@/components/layout/MainLayout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import GuestRoute     from "@/components/auth/GuestRoute";

// Auth pages
import LoginPage    from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";

// General - Profile page
import ProfilePage from "@/pages/profile/ProfilePage";

// Admin pages
import AdminDashboard from "@/pages/admin/AdminDashboard";

// Job pages
import JobsPage       from "@/pages/jobs/JobsPage";
import JobDetailPage  from "@/pages/jobs/JobDetailPage";

// Employer pages
import EmployerDashboard from "@/pages/employer/EmployerDashboard";
import PostJobPage       from "@/pages/employer/PostJobPage";
import EditJobPage          from "@/pages/employer/EditJobPage";
import JobApplicationsPage from "@/pages/employer/JobApplicationsPage";

// Candidate pages
import CandidateDashboard from "@/pages/candidate/CandidateDashboard";

// Utility
import UnauthorizedPage from "@/pages/UnauthorizedPage";

function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <p className="text-gray-500 mb-6">Page not found.</p>
        <a href="/" className="btn-primary">Go home</a>
      </div>
    </div>
  );
}

export default function App() {
  const { initializeAuth } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <Routes>
      {/* Guest only */}
      <Route path="/login"    element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

      {/* Main layout (navbar + footer) */}
      <Route element={
        <ErrorBoundary>
          <MainLayout />
        </ErrorBoundary>
      }>
        {/* Root redirect */}
        <Route index element={<Navigate to="/jobs" replace />} />

        {/* Public */}
        <Route path="/jobs"     element={<JobsPage />} />
        <Route path="/jobs/:id" element={<JobDetailPage />} />

        {/* General Profile */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute allowedRoles={["candidate", "employer", "admin"]}>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        {/* Candidate */}
        <Route
          path="/candidate/dashboard"
          element={
            <ProtectedRoute allowedRoles={["candidate"]}>
              <CandidateDashboard />
            </ProtectedRoute>
          }
        />

        {/* Employer */}
        <Route
          path="/employer/dashboard"
          element={
            <ProtectedRoute allowedRoles={["employer"]}>
              <EmployerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employer/jobs/new"
          element={
            <ProtectedRoute allowedRoles={["employer"]}>
              <PostJobPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employer/jobs/:id/edit"
          element={
            <ProtectedRoute allowedRoles={["employer"]}>
              <EditJobPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employer/jobs/:id/applications"
          element={
            <ProtectedRoute allowedRoles={["employer"]}>
              <JobApplicationsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Utility */}
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}