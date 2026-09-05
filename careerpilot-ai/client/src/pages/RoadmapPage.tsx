import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Map, Target } from 'lucide-react';
import apiClient from '../services/apiClient';

interface Milestone {
  title: string;
  description: string;
  skills: string[];
  estimated_weeks: number;
  completed: boolean;
  order: number;
}

interface RoadmapResult {
  target_career: string;
  duration_months: number;
  available_hours_per_week: number;
  milestones: Milestone[];
  estimated_completion: string;
}

export default function RoadmapPage() {
  const [career, setCareer] = useState('');
  const [skills, setSkills] = useState('');
  const [hours, setHours] = useState(10);
  const [months, setMonths] = useState(6);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RoadmapResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const resp = await apiClient.post('/api/v1/ai-career/roadmap', {
        target_career: career,
        current_skills: skills.split(',').map((s) => s.trim()).filter(Boolean),
        available_hours_per_week: hours,
        duration_months: months,
      });
      setResult(resp);
    } catch {
      setError('Unable to generate roadmap right now.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-6 py-6 lg:px-8">
        <header className="mb-8 rounded-3xl border border-slate-800 bg-slate-900/70 px-5 py-4 shadow-soft backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-brand-500/10 p-3 text-brand-300">
              <Map className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Career Intelligence</p>
              <h1 className="text-2xl font-semibold text-white">Learning Roadmap</h1>
            </div>
          </div>
        </header>

        {error && <div className="mb-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</div>}

        <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
          <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-soft">
            <h2 className="mb-4 text-lg font-semibold text-white">Plan Your Journey</h2>
            <label className="mb-2 block text-sm text-slate-400">Target Career</label>
            <input
              value={career}
              onChange={(e) => setCareer(e.target.value)}
              className="mb-4 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-100 outline-none focus:border-brand-500"
              placeholder="Data Scientist"
              required
            />
            <label className="mb-2 block text-sm text-slate-400">Current Skills</label>
            <input
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              className="mb-4 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-100 outline-none focus:border-brand-500"
              placeholder="python, sql, statistics"
              required
            />
            <label className="mb-2 block text-sm text-slate-400">Hours per Week</label>
            <input
              type="number"
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
              className="mb-4 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-100 outline-none focus:border-brand-500"
              min={1}
              max={80}
            />
            <label className="mb-2 block text-sm text-slate-400">Duration (Months)</label>
            <input
              type="number"
              value={months}
              onChange={(e) => setMonths(Number(e.target.value))}
              className="mb-6 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-100 outline-none focus:border-brand-500"
              min={1}
              max={60}
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-500 disabled:opacity-50"
            >
              {loading ? 'Generating...' : 'Generate Roadmap'}
            </button>
          </form>

          {result && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-soft">
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-2xl bg-brand-500/10 p-3 text-brand-300">
                    <Target className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Target</p>
                    <h3 className="text-xl font-semibold text-white">{result.target_career}</h3>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-400">
                  <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{result.duration_months} months</span>
                  <span>{result.available_hours_per_week} hrs/week</span>
                </div>
              </div>

              <div className="space-y-4">
                {result.milestones.map((m, idx) => (
                  <motion.div key={m.title} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }} className="flex gap-4 rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-soft">
                    <div className="flex flex-col items-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500/10 text-brand-300">
                        <span className="text-sm font-semibold">{m.order}</span>
                      </div>
                      {idx < result.milestones.length - 1 && <div className="mt-2 h-8 w-px bg-slate-800" />}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-white">{m.title}</h4>
                      <p className="mt-1 text-sm text-slate-400">{m.description}</p>
                      <p className="mt-2 text-xs text-slate-500">{m.estimated_weeks} weeks</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
