import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Trash2 } from 'lucide-react';
import apiClient from '../services/apiClient';

interface JobMatchItem {
  _id: string;
  career: string;
  matchScore: number;
  confidence: string;
  strengths: string[];
  skillGaps: string[];
  reasoning: string;
  source: string;
}

export default function JobMatcherPage() {
  const [matches, setMatches] = useState<JobMatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMatches();
  }, []);

  async function loadMatches() {
    setLoading(true);
    setError(null);
    try {
      const resp = await apiClient.get('/api/job-matches');
      setMatches(resp.data || []);
    } catch {
      setError('Unable to load job matches.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await apiClient.delete(`/api/job-matches/${id}`);
      setMatches((prev) => prev.filter((m) => m._id !== id));
    } catch {
      setError('Unable to delete job match.');
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-6 py-6 lg:px-8">
        <header className="mb-8 rounded-3xl border border-slate-800 bg-slate-900/70 px-5 py-4 shadow-soft backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-brand-500/10 p-3 text-brand-300">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Job Matching</p>
              <h1 className="text-2xl font-semibold text-white">Job Matcher</h1>
            </div>
          </div>
        </header>

        {error && <div className="mb-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</div>}

        {loading ? (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 text-sm text-slate-400">Loading job matches...</div>
        ) : matches.length === 0 ? (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 text-sm text-slate-400">No job matches yet. Use Career Explorer to generate matches.</div>
        ) : (
          <div className="space-y-4">
            {matches.map((m, idx) => (
              <motion.div key={m._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-soft">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">{m.career}</h3>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-brand-500/10 px-3 py-1 text-sm text-brand-300">{m.matchScore}%</span>
                    <button onClick={() => handleDelete(m._id)} className="rounded-full p-2 text-slate-400 hover:text-rose-300">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="mb-2 text-sm text-slate-400">{m.reasoning}</p>
                <div className="flex flex-wrap gap-2">
                  {m.strengths.map((s) => (
                    <span key={s} className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200">{s}</span>
                  ))}
                  {m.skillGaps.map((s) => (
                    <span key={s} className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs text-rose-200">{s}</span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
