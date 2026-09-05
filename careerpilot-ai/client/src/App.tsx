import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import DashboardPage from './pages/DashboardPage';
import CareerExplorerPage from './pages/CareerExplorerPage';
import SkillGapPage from './pages/SkillGapPage';
import RoadmapPage from './pages/RoadmapPage';
import ProjectsPage from './pages/ProjectsPage';
import ResumeAnalyzerPage from './pages/ResumeAnalyzerPage';
import InterviewCoachPage from './pages/InterviewCoachPage';
import JobMatcherPage from './pages/JobMatcherPage';
import CareerComparisonPage from './pages/CareerComparisonPage';
import AiChatPage from './pages/AiChatPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';
import RequireAuth from './components/RequireAuth';

function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
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
    </div>
  );
}

export default App;
