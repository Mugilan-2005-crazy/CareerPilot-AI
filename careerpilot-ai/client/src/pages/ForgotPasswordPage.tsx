import { Link } from 'react-router-dom';
import { ArrowLeft, Mail } from 'lucide-react';
import { useState } from 'react';
import { forgotPassword } from '../services/authService';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError(null);
    setSent(false);
    try {
      await forgotPassword(email);
      setSent(true);
      setEmail('');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.2),_transparent_40%)] px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-soft backdrop-blur">
        <Link to="/login" className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to login
        </Link>
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-300">Reset password</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Recover your account</h1>
        </div>

        {sent ? (
          <p className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
            If an account exists for that email, a reset link has been sent.
          </p>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm text-slate-400">Email address</span>
              <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3">
                <Mail className="h-4 w-4 text-slate-500" />
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  required
                  placeholder="you@example.com"
                  className="w-full bg-transparent outline-none"
                />
              </div>
            </label>
            {error && <p className="text-sm text-rose-300">{error}</p>}
            <button disabled={loading} type="submit" className="w-full rounded-2xl bg-brand-600 px-4 py-3 font-medium text-white transition hover:bg-brand-700">
              {loading ? 'Sending…' : 'Send Reset Link'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
