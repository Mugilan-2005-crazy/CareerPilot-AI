import { motion } from 'framer-motion';
import { BrainCircuit, Briefcase, Code2, FileCheck, FileText, MessageSquareText, MoonStar, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import apiClient from '../services/apiClient';

interface Stats {
  resumeCount: number;
  mockInterviewCount: number;
  analysisCount: number;
  progressCount: number;
  lastAtsScore: string | null;
  firstName: string | null;
}

const emptyStats: Stats = {
  resumeCount: 0,
  mockInterviewCount: 0,
  analysisCount: 0,
  progressCount: 0,
  lastAtsScore: null,
  firstName: null,
};

async function loadStats(setStats: (s: Stats) => void, setError: (m: string | null) => void) {
  try {
    const [resumes, interviews, analyses, progress] = await Promise.all([
      apiClient.get('/api/resumes').catch(() => ({ data: [] })),
      apiClient.get('/api/mock-interviews').catch(() => ({ data: [] })),
      apiClient.get('/api/resume-analyses').catch(() => ({ data: [] })),
      apiClient.get('/api/progress').catch(() => ({ data: [] })),
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
      firstName: null,
    });
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

  useEffect(() => {
    loadStats(setStats, setError);
  }, []);

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
            <h1 className="text-2xl font-semibold text-white">Welcome back{stats.firstName ? `, ${stats.firstName}` : ''}</h1>
          </div>
          <button
            onClick={() => setDark((value) => !value)}
            className={`rounded-full border p-2 transition ${dark ? 'border-slate-700 bg-slate-800 text-slate-100' : 'border-slate-200 bg-white text-slate-700'}`}
          >
            {dark ? <Sun className="h-5 w-5" /> : <MoonStar className="h-5 w-5" />}
          </button>
        </header>

        {error && <div className="mb-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</div>}

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