import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import RequireAuth from './components/RequireAuth';
import { AuthProvider } from './context/AuthContext';

// Route-level code splitting: each page becomes its own lazy chunk so visitors
// only download the payload for the route they actually open. This keeps the
// initial bundle small (Vite emits a warning above 500 kB) while preserving
// identical runtime behaviour. The server remains the authority for access
// control; RequireAuth is only a UX guard as before.
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const CareerExplorerPage = lazy(() => import('./pages/CareerExplorerPage'));
const SkillGapPage = lazy(() => import('./pages/SkillGapPage'));
const RoadmapPage = lazy(() => import('./pages/RoadmapPage'));
const ProjectsPage = lazy(() => import('./pages/ProjectsPage'));
const ResumeAnalyzerPage = lazy(() => import('./pages/ResumeAnalyzerPage'));
const InterviewCoachPage = lazy(() => import('./pages/InterviewCoachPage'));
const JobMatcherPage = lazy(() => import('./pages/JobMatcherPage'));
const CareerComparisonPage = lazy(() => import('./pages/CareerComparisonPage'));
const AiChatPage = lazy(() => import('./pages/AiChatPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

// Inline loading fallback shown while a lazy route chunk is being fetched.
// It mirrors the app shell background so the swap is visually seamless.
function RouteFallback() {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400"
      role="status"
      aria-label="Loading page"
    >
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-amber-400" />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <DashboardPage />
              </RequireAuth>
            }
          />
          <Route
            path="/careers"
            element={
              <RequireAuth>
                <CareerExplorerPage />
              </RequireAuth>
            }
          />
          <Route
            path="/skill-gap"
            element={
              <RequireAuth>
                <SkillGapPage />
              </RequireAuth>
            }
          />
          <Route
            path="/roadmap"
            element={
              <RequireAuth>
                <RoadmapPage />
              </RequireAuth>
            }
          />
          <Route
            path="/projects"
            element={
              <RequireAuth>
                <ProjectsPage />
              </RequireAuth>
            }
          />
          <Route
            path="/resume-analyzer"
            element={
              <RequireAuth>
                <ResumeAnalyzerPage />
              </RequireAuth>
            }
          />
          <Route
            path="/interview-coach"
            element={
              <RequireAuth>
                <InterviewCoachPage />
              </RequireAuth>
            }
          />
          <Route
            path="/job-matcher"
            element={
              <RequireAuth>
                <JobMatcherPage />
              </RequireAuth>
            }
          />
          <Route
            path="/career-comparison"
            element={
              <RequireAuth>
                <CareerComparisonPage />
              </RequireAuth>
            }
          />
          <Route
            path="/ai-chat"
            element={
              <RequireAuth>
                <AiChatPage />
              </RequireAuth>
            }
          />
          <Route
            path="/analytics"
            element={
              <RequireAuth>
                <AnalyticsPage />
              </RequireAuth>
            }
          />
          <Route
            path="/settings"
            element={
              <RequireAuth>
                <SettingsPage />
              </RequireAuth>
            }
          />
        </Routes>
        </Suspense>
      </div>
    </AuthProvider>
  );
}

export default App;
