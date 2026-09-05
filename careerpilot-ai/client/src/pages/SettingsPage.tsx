import { useState } from 'react';
import { MoonStar, Sun, SettingsIcon } from 'lucide-react';

export default function SettingsPage() {
  const [dark, setDark] = useState(true);
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-6 py-6 lg:px-8">
        <header className="mb-8 rounded-3xl border border-slate-800 bg-slate-900/70 px-5 py-4 shadow-soft backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-brand-500/10 p-3 text-brand-300">
              <SettingsIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Preferences</p>
              <h1 className="text-2xl font-semibold text-white">Settings</h1>
            </div>
          </div>
        </header>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-soft">
          <h2 className="mb-4 text-lg font-semibold text-white">Appearance</h2>
          <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3">
            <div>
              <p className="font-medium text-slate-100">Dark Mode</p>
              <p className="text-xs text-slate-400">Toggle between light and dark themes</p>
            </div>
            <button
              onClick={() => setDark((v) => !v)}
              className={`rounded-full border p-2 transition ${dark ? 'border-slate-700 bg-slate-800 text-slate-100' : 'border-slate-200 bg-white text-slate-700'}`}
            >
              {dark ? <MoonStar className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </button>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSave}
              className="rounded-full bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-500"
            >
              {saved ? 'Saved' : 'Save Preferences'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
