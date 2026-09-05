import { useState } from 'react';
import { motion } from 'framer-motion';
import { GitFork, AlertTriangle, BookOpen } from 'lucide-react';
import apiClient from '../services/apiClient';

interface SkillGapResult {
  target_career: string;
  detected_skills: string[];
  missing_skills: string[];
  gap_summary: string;
  priority: string;
  estimated_effort: string;
  recommended_projects: string[];
}

export default function SkillGapPage() {
  const [skills, setSkills] = useState('');
  const [career, setCareer] = useState('');
  const [experience, setExperience] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SkillGapResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const resp = await apiClient.post('/api/ai-career/skill-gap-enhanced', {
        current_skills: skills.split(',').map((s) => s.trim()).filter(Boolean),
        target_career: career,
        experience_years: experience,
      });
      setResult(resp);
    } catch {
      setError('Unable to analyze skill gap right now.');
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
              <GitFork className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Career Intelligence</p>
              <h1 className="text-2xl font-semibold text-white">Skill Gap Analysis</h1>
            </div>
          </div>
        </header>

        {error && <div className="mb-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</div>}

        <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
          <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-soft">
            <h2 className="mb-4 text-lg font-semibold text-white">Analyze Gap</h2>
            <label className="mb-2 block text-sm text-slate-400">Current Skills</label>
            <input
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              className="mb-4 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-100 outline-none focus:border-brand-500"
              placeholder="python, sql, react"
              required
            />
            <label className="mb-2 block text-sm text-slate-400">Target Career</label>
            <input
              value={career}
              onChange={(e) => setCareer(e.target.value)}
              className="mb-4 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-100 outline-none focus:border-brand-500"
              placeholder="Data Scientist"
              required
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
              {loading ? 'Analyzing...' : 'Analyze Gap'}
            </button>
          </form>

          {result && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-soft">
                <h3 className="mb-2 text-lg font-semibold text-white">{result.target_career}</h3>
                <p className="text-sm text-slate-400">{result.gap_summary}</p>
                <div className="mt-4 flex items-center gap-4 text-sm">
                  <span className="rounded-full bg-amber-500/10 px-3 py-1 text-amber-300">{result.priority} priority</span>
                  <span className="rounded-full bg-slate-800 px-3 py-1 text-slate-300">{result.estimated_effort}</span>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-soft">
                <div className="mb-4 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-300" />
                  <h4 className="font-semibold text-white">Missing Skills</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {result.missing_skills.map((s) => (
                    <span key={s} className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs text-rose-200">{s}</span>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-soft">
                <div className="mb-4 flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-brand-300" />
                  <h4 className="font-semibold text-white">Recommended Projects</h4>
                </div>
                <div className="space-y-2">
                  {result.recommended_projects.map((p) => (
                    <div key={p} className="rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-2 text-sm text-slate-300">{p}</div>
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
