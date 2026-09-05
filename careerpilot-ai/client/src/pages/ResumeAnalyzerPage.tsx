import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, BrainCircuit } from 'lucide-react';
import apiClient from '../services/apiClient';

interface ResumeResult {
  ats_score: number;
  summary: string;
  keywords_detected: string[];
  recommendations: string[];
}

export default function ResumeAnalyzerPage() {
  const [resumeText, setResumeText] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResumeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const resp = await apiClient.post('/api/v1/ai/resume-analysis', {
        resume_text: resumeText,
        target_role: targetRole || undefined,
      });
      setResult(resp);
    } catch {
      setError('Unable to analyze resume right now.');
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
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Resume Intelligence</p>
              <h1 className="text-2xl font-semibold text-white">Resume Analyzer</h1>
            </div>
          </div>
        </header>

        {error && <div className="mb-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</div>}

        <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
          <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-soft">
            <h2 className="mb-4 text-lg font-semibold text-white">Upload Resume</h2>
            <label className="mb-2 block text-sm text-slate-400">Resume Text</label>
            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              className="mb-4 h-40 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-100 outline-none focus:border-brand-500"
              placeholder="Paste your resume text here..."
              required
            />
            <label className="mb-2 block text-sm text-slate-400">Target Role (optional)</label>
            <input
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="mb-6 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-100 outline-none focus:border-brand-500"
              placeholder="Software Engineer"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-500 disabled:opacity-50"
            >
              {loading ? 'Analyzing...' : 'Analyze Resume'}
            </button>
          </form>

          {result && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-soft">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-brand-500/10 p-3 text-brand-300">
                      <BrainCircuit className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">ATS Score</p>
                      <h3 className="text-xl font-semibold text-white">{result.ats_score}%</h3>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-slate-400">{result.summary}</p>
              </div>

              <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-soft">
                <h4 className="mb-2 font-semibold text-white">Keywords Detected</h4>
                <div className="flex flex-wrap gap-2">
                  {result.keywords_detected.map((k) => (
                    <span key={k} className="rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-xs text-brand-200">{k}</span>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-soft">
                <h4 className="mb-2 font-semibold text-white">Recommendations</h4>
                <ul className="list-disc space-y-1 pl-5 text-sm text-slate-400">
                  {result.recommendations.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
