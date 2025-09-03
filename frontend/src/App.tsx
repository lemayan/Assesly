import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider } from './components/Toast';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ExamPage from './pages/ExamPage';
import ResultsPage from './pages/ResultsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import AdminPage from './pages/admin/AdminPage';
const ExamsPage = lazy(() => import('./pages/admin').then(m => ({ default: m.ExamsPage })));
const QuestionsPage = lazy(() => import('./pages/admin').then(m => ({ default: m.QuestionsPage })));
const UsersPage = lazy(() => import('./pages/admin').then(m => ({ default: m.UsersPage })));
const SettingsPage = lazy(() => import('./pages/admin').then(m => ({ default: m.SettingsPage })));
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/Layout';
import AdminDashboard from './pages/admin/AdminDashboard';
import StudentDashboard from './pages/student/StudentDashboard';
import LandingPage from './pages/LandingPage';
// Inline simple NotFound to avoid import resolution issues

function PrivateRoute({ children }: { children: JSX.Element }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }: { children: JSX.Element }) {
  const { token, user } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  if (user?.role !== 'admin') return <Navigate to="/student/dashboard" replace />;
  return children;
}

function StudentRoute({ children }: { children: JSX.Element }) {
  const { token, user } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  if (user?.role !== 'student') return <Navigate to="/admin/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
        <ErrorBoundary>
  <Suspense fallback={<div className="container py-10">Loading…</div>}>
  <Routes>
  <Route path="/" element={<LandingOrHome />} />
  <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<PrivateRoute><RoleRedirect /></PrivateRoute>} />
          <Route path="/student/dashboard" element={<StudentRoute><Layout><StudentDashboard /></Layout></StudentRoute>} />
          <Route path="/admin/dashboard" element={<AdminRoute><Layout><AdminDashboard /></Layout></AdminRoute>} />
          {/* Admin manage area split into sub-pages for clarity */}
          <Route path="/admin" element={<AdminRoute><Navigate to="/admin/exams" replace /></AdminRoute>} />
          <Route path="/admin/exams" element={<AdminRoute><Layout><ExamsPage /></Layout></AdminRoute>} />
          <Route path="/admin/questions" element={<AdminRoute><Layout><QuestionsPage /></Layout></AdminRoute>} />
          <Route path="/admin/users" element={<AdminRoute><Layout><UsersPage /></Layout></AdminRoute>} />
          <Route path="/admin/settings" element={<AdminRoute><Layout><SettingsPage /></Layout></AdminRoute>} />
          <Route path="/exam/:id" element={<PrivateRoute><Layout><ExamPage /></Layout></PrivateRoute>} />
          {/* Common typo redirect: /exany/:id -> /exam/:id */}
          <Route path="/exany/:id" element={<ExanyRedirect />} />
          <Route path="/results" element={<PrivateRoute><Layout><ResultsPage /></Layout></PrivateRoute>} />
          <Route path="/analytics" element={<PrivateRoute><Layout><AnalyticsPage /></Layout></PrivateRoute>} />
          {/* Catch-all to avoid blank screens on bad URLs */}
          <Route path="*" element={<InlineNotFound />} />
  </Routes>
  </Suspense>
  </ErrorBoundary>
  </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

function LandingOrHome() {
  // Always show Landing on '/'
  return <LandingPage />;
}

function ExanyRedirect() {
  const { id } = useParams();
  return <Navigate to={`/exam/${id}`} replace />;
}

function InlineNotFound() {
  return (
    <div className="container py-10 text-center">
      <h1 className="text-2xl font-semibold mb-2">Page not found</h1>
      <p className="text-gray-600 dark:text-gray-300 mb-4">The page you’re looking for doesn’t exist.</p>
      <a href="/" className="inline-block px-4 py-2 rounded bg-blue-600 text-white">Back to Dashboard</a>
    </div>
  );
}

function RoleRedirect() {
  const { user } = useAuth();
  if (user?.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  if (user?.role === 'student') return <Navigate to="/student/dashboard" replace />;
  return <Navigate to="/login" replace />;
}
