import { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquareText, Target } from 'lucide-react';
import apiClient from '../services/apiClient';

interface InterviewResult {
  role: string;
  difficulty: string;
  questions: string[];
}

export default function InterviewCoachPage() {
  const [role, setRole] = useState('');
  const [level, setLevel] = useState('mid');
  const [difficulty, setDifficulty] = useState('medium');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<InterviewResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const resp = await apiClient.post('/api/ai/interview-questions', {
        role,
        experience_level: level,
        difficulty,
      });
      setResult(resp);
    } catch {
      setError('Unable to generate interview questions right now.');
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
              <MessageSquareText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Interview Preparation</p>
              <h1 className="text-2xl font-semibold text-white">Interview Coach</h1>
            </div>
          </div>
        </header>

        {error && <div className="mb-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</div>}

        <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
          <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-soft">
            <h2 className="mb-4 text-lg font-semibold text-white">Configure Interview</h2>
            <label className="mb-2 block text-sm text-slate-400">Target Role</label>
            <input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="mb-4 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-100 outline-none focus:border-brand-500"
              placeholder="Software Engineer"
              required
            />
            <label className="mb-2 block text-sm text-slate-400">Experience Level</label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="mb-4 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-100 outline-none focus:border-brand-500"
            >
              <option value="junior">Junior</option>
              <option value="mid">Mid</option>
              <option value="senior">Senior</option>
            </select>
            <label className="mb-2 block text-sm text-slate-400">Difficulty</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="mb-6 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-100 outline-none focus:border-brand-500"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-500 disabled:opacity-50"
            >
              {loading ? 'Generating...' : 'Generate Questions'}
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
                    <p className="text-sm text-slate-400">Role</p>
                    <h3 className="text-xl font-semibold text-white">{result.role}</h3>
                  </div>
                  <span className="ml-auto rounded-full bg-brand-500/10 px-3 py-1 text-sm text-brand-300">{result.difficulty}</span>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-soft">
                <h4 className="mb-4 font-semibold text-white">Questions</h4>
                <div className="space-y-4">
                  {result.questions.map((q, idx) => (
                    <div key={idx} className="rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm text-slate-300">
                      <span className="mr-2 text-brand-300">{idx + 1}.</span>{q}
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
