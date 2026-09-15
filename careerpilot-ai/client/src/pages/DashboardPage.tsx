import { motion } from 'framer-motion';
import { BrainCircuit, Briefcase, Code2, FileCheck, FileText, MessageSquareText, MoonStar, Sun, LogOut, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import apiClient from '../services/apiClient';
import { useAuth } from '../context/AuthContext';

interface Stats {
  resumeCount: number;
  mockInterviewCount: number;
  analysisCount: number;
  progressCount: number;
  lastAtsScore: string | null;
}

interface NbaAction {
  title: string;
  why: string;
  expectedOutcome: string;
  effort: string;
  priority: string;
  roi?: string;
  kind?: string;
}

interface NbaData {
  primary: NbaAction | null;
  secondary: NbaAction[];
  optional: NbaAction[];
  context: { evidenceStrength: number | null; targetRole: string | null; twinVersion: number | null };
}

interface ProgressData {
  status: string;
  snapshots?: number;
  change?: { evidenceStrength: number; skillCount: number };
}

const emptyStats: Stats = {
  resumeCount: 0,
  mockInterviewCount: 0,
  analysisCount: 0,
  progressCount: 0,
  lastAtsScore: null,
};

async function loadStats(
  setStats: (s: Stats) => void,
  setError: (m: string | null) => void,
  setNba: (n: NbaData | null) => void,
  setProgress: (p: ProgressData | null) => void,
) {
  try {
    const [resumes, interviews, analyses, progress, nba, twinProgress] = await Promise.all([
      apiClient.get('/api/resumes').catch(() => ({ data: [] })),
      apiClient.get('/api/mock-interviews').catch(() => ({ data: [] })),
      apiClient.get('/api/resume-analyses').catch(() => ({ data: [] })),
      apiClient.get('/api/progress').catch(() => ({ data: [] })),
      // Career Intelligence loop (v1.1). Non-fatal when unavailable.
      apiClient.get('/api/v1/career-twin/next-best-action').catch(() => null),
      apiClient.get('/api/v1/career-twin/progress').catch(() => null),
    ]);

    const resumesList = (resumes && resumes.data) || [];
    const analysesList = (analyses && analyses.data) || [];
    const lastAnalysis = analysesList[0];

    setStats({
      resumeCount: resumesList.length,
      mockInterviewCount: (interviews && interviews.data) ? interviews.data.length : 0,
      analysisCount: analysesList.length,
      progressCount: (progress && progress.data) ? progress.data.length : 0,
      lastAtsScore: lastAnalysis && lastAnalysis.atsScore != null ? `${lastAnalysis.atsScore}%` : null,
    });
    setNba(nba && nba.success ? (nba.data as NbaData) : null);
    setProgress(twinProgress && twinProgress.success ? (twinProgress.data as ProgressData) : null);
    setError(null);
  } catch {
    setStats(emptyStats);
    setError('Unable to load dashboard data right now.');
  }
}

export default function DashboardPage() {
  const [dark, setDark] = useState(true);
  const [stats, setStats] = useState<Stats>(emptyStats);
  const [error, setError] = useState<string | null>(null);
  const [nba, setNba] = useState<NbaData | null>(null);
  const [twinProgress, setTwinProgress] = useState<ProgressData | null>(null);
  const { user, logout, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading) {
      loadStats(setStats, setError, setNba, setTwinProgress);
    }
  }, [authLoading]);

  const firstName = user?.name?.split(' ')[0] || null;

  const overviewCards = [
    { title: 'Resumes', value: String(stats.resumeCount), subtitle: stats.lastAtsScore ? `Latest ATS score ${stats.lastAtsScore}` : 'Upload a resume to start' },
    { title: 'Resume Analyses', value: String(stats.analysisCount), subtitle: 'Run by AI' },
    { title: 'Mock Interviews', value: String(stats.mockInterviewCount), subtitle: 'Completed' },
  ];

  const tasks = [
    { title: 'Resume Intelligence', detail: `${stats.analysisCount} analysis report${stats.analysisCount === 1 ? '' : 's'} generated`, icon: FileCheck },
    { title: 'Progress Modules', detail: `${stats.progressCount} module${stats.progressCount === 1 ? '' : 's'} tracked`, icon: Code2 },
    { title: 'Preparation', detail: 'Company-specific aptitude, technical and communication modules', icon: FileText },
  ];

  return (
    <div className={dark ? 'min-h-screen bg-slate-950 text-slate-100' : 'min-h-screen bg-slate-50 text-slate-900'}>
      <div className="mx-auto max-w-7xl px-6 py-6 lg:px-8">
        <header className="mb-8 flex items-center justify-between rounded-3xl border border-slate-800 bg-slate-900/70 px-5 py-4 shadow-soft backdrop-blur">
          <div>
            <p className="text-sm text-slate-400">Student Dashboard</p>
            <h1 className="text-2xl font-semibold text-white">Welcome back{firstName ? `, ${firstName}` : ''}</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-200">
              <UserRound className="h-4 w-4" />
              <span className="hidden sm:inline">{user?.email}</span>
            </div>
            <button
              onClick={() => setDark((value) => !value)}
              className={`rounded-full border p-2 transition ${dark ? 'border-slate-700 bg-slate-800 text-slate-100' : 'border-slate-200 bg-white text-slate-700'}`}
            >
              {dark ? <Sun className="h-5 w-5" /> : <MoonStar className="h-5 w-5" />}
            </button>
            <button
              onClick={logout}
              className="flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-sm text-rose-200 transition hover:bg-rose-500/20"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {error && <div className="mb-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</div>}

        {nba && nba.primary && (
          <div className={`mb-6 rounded-3xl border p-6 shadow-soft ${dark ? 'border-amber-400/20 bg-slate-900/70' : 'border-amber-300 bg-white'}`}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className={`text-sm ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Next Best Action</p>
                <h2 className={`text-xl font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>{nba.primary.title}</h2>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="rounded-full bg-amber-400/10 px-3 py-1 text-amber-300">{nba.primary.priority}</span>
                {nba.primary.roi && <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-emerald-300">ROI {nba.primary.roi}</span>}
                {nba.context.evidenceStrength != null && (
                  <span className={`rounded-full px-3 py-1 ${dark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                    Evidence strength {nba.context.evidenceStrength}/100
                  </span>
                )}
              </div>
            </div>
            <p className={`text-sm ${dark ? 'text-slate-300' : 'text-slate-600'}`}>{nba.primary.why}</p>
            <p className={`mt-1 text-sm ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
              Expected outcome: {nba.primary.expectedOutcome} · Effort: {nba.primary.effort}
            </p>
            {twinProgress && twinProgress.status === 'ok' && twinProgress.change && (
              <p className={`mt-3 text-sm ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                Progress since baseline: evidence strength {twinProgress.change.evidenceStrength >= 0 ? '+' : ''}
                {twinProgress.change.evidenceStrength}, skills {twinProgress.change.skillCount >= 0 ? '+' : ''}
                {twinProgress.change.skillCount} ({twinProgress.snapshots} snapshots)
              </p>
            )}
            {nba.secondary.length > 0 && (
              <ul className="mt-3 space-y-1 text-sm text-slate-400">
                {nba.secondary.map((a) => (
                  <li key={a.title} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-brand-400" />
                    <span><span className="text-slate-300">{a.title}</span> — {a.why}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {overviewCards.map((card, index) => (
            <motion.div key={card.title} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }} className={`rounded-3xl border p-6 shadow-soft ${dark ? 'border-slate-800 bg-slate-900/70' : 'border-slate-200 bg-white'}`}>
              <p className={`text-sm ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{card.title}</p>
              <p className={`mt-3 text-3xl font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>{card.value}</p>
              <p className={`mt-1 text-sm ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{card.subtitle}</p>
            </motion.div>
          ))}
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
          <div className={`rounded-3xl border p-6 shadow-soft ${dark ? 'border-slate-800 bg-slate-900/70' : 'border-slate-200 bg-white'}`}>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className={`text-sm ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Current Focus</p>
                <h2 className={`text-xl font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>Build your placement readiness</h2>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-brand-500/10 px-3 py-1 text-sm text-brand-300">
                <Briefcase className="h-4 w-4" />
                On track
              </div>
            </div>
            <div className="mt-6 space-y-3">
              {tasks.map((task) => {
                const Icon = task.icon;
                return (
                  <div key={task.title} className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${dark ? 'border-slate-800 bg-slate-950/70' : 'border-slate-200 bg-slate-50'}`}>
                    <div className="rounded-xl bg-brand-500/10 p-2 text-brand-300">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className={`font-medium ${dark ? 'text-white' : 'text-slate-900'}`}>{task.title}</p>
                      <p className={`text-sm ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{task.detail}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className={`rounded-3xl border p-6 shadow-soft ${dark ? 'border-slate-800 bg-slate-900/70' : 'border-slate-200 bg-white'}`}>
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-2xl bg-brand-500/10 p-3 text-brand-300">
                <BrainCircuit className="h-5 w-5" />
              </div>
              <div>
                <p className={`text-sm ${dark ? 'text-slate-400' : 'text-slate-500'}`}>AI Assistance</p>
                <h2 className={`text-xl font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>Resume analysis</h2>
              </div>
            </div>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex items-start gap-2">
                <MessageSquareText className="mt-0.5 h-4 w-4 text-brand-300" />
                Upload a resume and run an AI analysis to get ATS feedback.
              </li>
              <li className="flex items-start gap-2">
                <FileCheck className="mt-0.5 h-4 w-4 text-brand-300" />
                {stats.lastAtsScore ? `Latest ATS score: ${stats.lastAtsScore}` : 'No ATS score yet.'}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}