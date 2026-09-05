import { useState } from 'react';
import { motion } from 'framer-motion';
import { GitCompare, Target } from 'lucide-react';
import apiClient from '../services/apiClient';

interface CareerMatch {
  career: string;
  match_score: number;
  confidence: string;
  strengths: string[];
  skill_gaps: string[];
  reasoning: string;
}

export default function CareerComparisonPage() {
  const [skills, setSkills] = useState('');
  const [interests, setInterests] = useState('');
  const [experience, setExperience] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ matches: CareerMatch[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const resp = await apiClient.post('/api/v1/ai-career/career-matching', {
        skills: skills.split(',').map((s) => s.trim()).filter(Boolean),
        interests: interests.split(',').map((s) => s.trim()).filter(Boolean),
        experience_years: experience,
      });
      setResult({ matches: resp.all_matches || [] });
    } catch {
      setError('Unable to compare careers right now.');
    } finally {
      setLoading(false);
    }
  }

  const top = result?.matches[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-6 py-6 lg:px-8">
        <header className="mb-8 rounded-3xl border border-slate-800 bg-slate-900/70 px-5 py-4 shadow-soft backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-brand-500/10 p-3 text-brand-300">
              <GitCompare className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Career Intelligence</p>
              <h1 className="text-2xl font-semibold text-white">Career Comparison</h1>
            </div>
          </div>
        </header>

        {error && <div className="mb-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</div>}

        <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
          <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-soft">
            <h2 className="mb-4 text-lg font-semibold text-white">Your Profile</h2>
            <label className="mb-2 block text-sm text-slate-400">Skills (comma-separated)</label>
            <input
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              className="mb-4 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-100 outline-none focus:border-brand-500"
              placeholder="python, javascript, sql, docker"
              required
            />
            <label className="mb-2 block text-sm text-slate-400">Interests (comma-separated)</label>
            <input
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              className="mb-4 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-100 outline-none focus:border-brand-500"
              placeholder="ai, cloud, data"
            />
            <label className="mb-2 block text-sm text-slate-400">Years of Experience</label>
            <input
              type="number"
              value={experience}
              onChange={(e) => setExperience(Number(e.target.value))}
              className="mb-6 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-100 outline-none focus:border-brand-500"
              min={0}
              max={60}
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-500 disabled:opacity-50"
            >
              {loading ? 'Comparing...' : 'Compare Careers'}
            </button>
          </form>

          {result && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {top && (
                <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-soft">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="rounded-2xl bg-brand-500/10 p-3 text-brand-300">
                      <Target className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Best Match</p>
                      <h3 className="text-xl font-semibold text-white">{top.career}</h3>
                    </div>
                    <span className="ml-auto rounded-full bg-brand-500/10 px-3 py-1 text-sm text-brand-300">{top.match_score}%</span>
                  </div>
                  <p className="text-sm text-slate-400">{top.reasoning}</p>
                  <div className="mt-4">
                    <p className="text-sm font-medium text-slate-300">Skill Gaps</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {top.skill_gaps.map((s) => (
                        <span key={s} className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs text-rose-200">{s}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-soft">
                <h3 className="mb-4 text-lg font-semibold text-white">All Matches</h3>
                <div className="space-y-3">
                  {result.matches.map((m) => (
                    <div key={m.career} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3">
                      <div>
                        <p className="font-medium text-slate-100">{m.career}</p>
                        <p className="text-xs text-slate-400">{m.confidence} confidence</p>
                      </div>
                      <span className="rounded-full bg-brand-500/10 px-3 py-1 text-sm text-brand-300">{m.match_score}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
