import { useState } from 'react';
import { motion } from 'framer-motion';
import { Layers } from 'lucide-react';
import apiClient from '../services/apiClient';

interface ProjectRec {
  title: string;
  description: string;
  problem: string;
  technologies: string[];
  skills_covered: string[];
  difficulty: string;
  expected_outcome: string;
  architecture: string;
  milestones: string[];
  resume_bullets: string[];
}

export default function ProjectsPage() {
  const [career, setCareer] = useState('');
  const [skills, setSkills] = useState('');
  const [difficulty, setDifficulty] = useState('intermediate');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ recommendations: ProjectRec[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const resp = await apiClient.post('/api/v1/ai-career/project-recommendations', {
        target_career: career,
        current_skills: skills.split(',').map((s) => s.trim()).filter(Boolean),
        difficulty,
      });
      setResult(resp);
    } catch {
      setError('Unable to recommend projects right now.');
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
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Career Intelligence</p>
              <h1 className="text-2xl font-semibold text-white">Project Recommendations</h1>
            </div>
          </div>
        </header>

        {error && <div className="mb-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</div>}

        <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
          <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-soft">
            <h2 className="mb-4 text-lg font-semibold text-white">Find Projects</h2>
            <label className="mb-2 block text-sm text-slate-400">Target Career</label>
            <input
              value={career}
              onChange={(e) => setCareer(e.target.value)}
              className="mb-4 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-100 outline-none focus:border-brand-500"
              placeholder="Software Engineer"
              required
            />
            <label className="mb-2 block text-sm text-slate-400">Current Skills</label>
            <input
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              className="mb-4 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-100 outline-none focus:border-brand-500"
              placeholder="python, react, sql"
              required
            />
            <label className="mb-2 block text-sm text-slate-400">Difficulty</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="mb-6 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-100 outline-none focus:border-brand-500"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-500 disabled:opacity-50"
            >
              {loading ? 'Finding...' : 'Find Projects'}
            </button>
          </form>

          {result && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {result.recommendations.map((p) => (
                <div key={p.title} className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-soft">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">{p.title}</h3>
                    <span className="rounded-full bg-brand-500/10 px-3 py-1 text-xs text-brand-300">{p.difficulty}</span>
                  </div>
                  <p className="text-sm text-slate-400">{p.description}</p>
                  <div className="mt-4">
                    <p className="text-xs font-medium text-slate-500">Technologies</p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {p.technologies.map((t) => (
                        <span key={t} className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs text-slate-300">{t}</span>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-xs font-medium text-slate-500">Problem</p>
                    <p className="mt-1 text-sm text-slate-400">{p.problem}</p>
                  </div>
                  <div className="mt-4">
                    <p className="text-xs font-medium text-slate-500">Architecture</p>
                    <p className="mt-1 text-sm text-slate-400">{p.architecture}</p>
                  </div>
                  <div className="mt-4">
                    <p className="text-xs font-medium text-slate-500">Milestones</p>
                    <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-400">
                      {p.milestones.map((m) => (
                        <li key={m}>{m}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-4">
                    <p className="text-xs font-medium text-slate-500">Resume Bullets</p>
                    <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-400">
                      {p.resume_bullets.map((b) => (
                        <li key={b}>{b}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
