import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, Mail } from 'lucide-react';
import { useState } from 'react';
import { login } from '../services/authService';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch {
      setError('Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.2),_transparent_40%)] px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-soft backdrop-blur">
        <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-300">Welcome back</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Login to CareerPilot AI</h1>
        </div>

        {error && <div className="mb-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</div>}

        <form className="space-y-4" onSubmit={handleSignIn}>
          <label className="block">
            <span className="mb-2 block text-sm text-slate-400">Email</span>
            <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3">
              <Mail className="h-4 w-4 text-slate-500" />
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@example.com" className="w-full bg-transparent outline-none" required />
            </div>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm text-slate-400">Password</span>
            <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3">
              <Lock className="h-4 w-4 text-slate-500" />
              <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="••••••••" className="w-full bg-transparent outline-none" required />
            </div>
          </label>

          <button disabled={loading} type="submit" className="w-full rounded-2xl bg-brand-600 px-4 py-3 font-medium text-white transition hover:bg-brand-700 disabled:opacity-50">
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-between text-sm text-slate-400">
          <Link to="/forgot-password" className="transition hover:text-white">Forgot password?</Link>
          <Link to="/register" className="transition hover:text-white">Create account</Link>
        </div>
      </div>
    </div>
  );
}
