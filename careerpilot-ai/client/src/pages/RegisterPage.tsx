import { Link } from 'react-router-dom';
import { ArrowLeft, UserRound, Mail, Lock } from 'lucide-react';

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.2),_transparent_40%)] px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-soft backdrop-blur">
        <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-300">Create account</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Join CareerPilot AI</h1>
        </div>

        <form className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm text-slate-400">Full Name</span>
            <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3">
              <UserRound className="h-4 w-4 text-slate-500" />
              <input type="text" placeholder="Aarav Kumar" className="w-full bg-transparent outline-none" />
            </div>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm text-slate-400">Email</span>
            <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3">
              <Mail className="h-4 w-4 text-slate-500" />
              <input type="email" placeholder="you@example.com" className="w-full bg-transparent outline-none" />
            </div>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm text-slate-400">Password</span>
            <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3">
              <Lock className="h-4 w-4 text-slate-500" />
              <input type="password" placeholder="Create a strong password" className="w-full bg-transparent outline-none" />
            </div>
          </label>

          <button type="button" className="w-full rounded-2xl bg-brand-600 px-4 py-3 font-medium text-white transition hover:bg-brand-700">
            Create Account
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="text-white transition hover:text-brand-300">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
