import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp } from 'lucide-react';
import apiClient from '../services/apiClient';

interface Stats {
  resumeCount: number;
  analysisCount: number;
  mockInterviewCount: number;
  progressCount: number;
  lastAtsScore: string | null;
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [resumes, analyses, interviews, progress] = await Promise.all([
          apiClient.get('/api/resumes').catch(() => ({ data: [] })),
          apiClient.get('/api/resume-analyses').catch(() => ({ data: [] })),
          apiClient.get('/api/mock-interviews').catch(() => ({ data: [] })),
          apiClient.get('/api/progress').catch(() => ({ data: [] })),
        ]);
        const analysesList = (analyses && analyses.data) || [];
        const lastAnalysis = analysesList[0];
        setStats({
          resumeCount: (resumes && resumes.data) ? resumes.data.length : 0,
          analysisCount: analysesList.length,
          mockInterviewCount: (interviews && interviews.data) ? interviews.data.length : 0,
          progressCount: (progress && progress.data) ? progress.data.length : 0,
          lastAtsScore: lastAnalysis && lastAnalysis.atsScore != null ? `${lastAnalysis.atsScore}%` : null,
        });
      } catch {
        setError('Unable to load analytics.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const cards = [
    { label: 'Resumes', value: stats?.resumeCount ?? 0 },
    { label: 'Analyses', value: stats?.analysisCount ?? 0 },
    { label: 'Mock Interviews', value: stats?.mockInterviewCount ?? 0 },
    { label: 'Progress Modules', value: stats?.progressCount ?? 0 },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-6 py-6 lg:px-8">
        <header className="mb-8 rounded-3xl border border-slate-800 bg-slate-900/70 px-5 py-4 shadow-soft backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-brand-500/10 p-3 text-brand-300">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Analytics</p>
              <h1 className="text-2xl font-semibold text-white">Your Progress</h1>
            </div>
          </div>
        </header>

        {error && <div className="mb-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</div>}

        {loading ? (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 text-sm text-slate-400">Loading analytics...</div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-4">
            {cards.map((c, i) => (
              <motion.div key={c.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-soft">
                <p className="text-sm text-slate-400">{c.label}</p>
                <p className="mt-3 text-3xl font-semibold text-white">{c.value}</p>
                {c.label === 'Analyses' && stats?.lastAtsScore && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-brand-300">
                    <TrendingUp className="h-3 w-3" /> Latest ATS: {stats.lastAtsScore}
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
