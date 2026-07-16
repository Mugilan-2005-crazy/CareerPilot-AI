import { motion } from 'framer-motion';
import { BrainCircuit, Briefcase, Code2, MessageSquareText, MoonStar, Sun } from 'lucide-react';
import { useState } from 'react';

const overviewCards = [
  { title: 'Resume Score', value: '91%', subtitle: 'ATS optimized' },
  { title: 'Placement Progress', value: '78%', subtitle: '3 modules ahead' },
  { title: 'Mock Interviews', value: '12', subtitle: 'Completed' },
];

const tasks = [
  { title: "Today's Aptitude Task", detail: 'Logical reasoning practice • 20 questions', icon: BrainCircuit },
  { title: "Today's Technical Task", detail: 'DSA arrays revision • 3 problems', icon: Code2 },
  { title: "Today's Communication Task", detail: 'Elevator pitch practice • 10 mins', icon: MessageSquareText },
];

export default function DashboardPage() {
  const [dark, setDark] = useState(true);

  return (
    <div className={dark ? 'min-h-screen bg-slate-950 text-slate-100' : 'min-h-screen bg-slate-50 text-slate-900'}>
      <div className="mx-auto max-w-7xl px-6 py-6 lg:px-8">
        <header className="mb-8 flex items-center justify-between rounded-3xl border border-slate-800 bg-slate-900/70 px-5 py-4 shadow-soft backdrop-blur">
          <div>
            <p className="text-sm text-slate-400">Student Dashboard</p>
            <h1 className="text-2xl font-semibold text-white">Welcome back, Aarav</h1>
          </div>
          <button
            onClick={() => setDark((value) => !value)}
            className={`rounded-full border p-2 transition ${dark ? 'border-slate-700 bg-slate-800 text-slate-100' : 'border-slate-200 bg-white text-slate-700'}`}
          >
            {dark ? <Sun className="h-5 w-5" /> : <MoonStar className="h-5 w-5" />}
          </button>
        </header>

        <div className="grid gap-6 lg:grid-cols-3">
          {overviewCards.map((card, index) => (
            <motion.div key={card.title} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }} className={`rounded-3xl border p-6 shadow-soft ${dark ? 'border-slate-800 bg-slate-900/70' : 'border-slate-200 bg-white'}`}>
              <p className={`text-sm ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{card.title}</p>
              <p className={`mt-3 text-3xl font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>{card.value}</p>
              <p className={`mt-1 text-sm ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{card.subtitle}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
          <div className={`rounded-3xl border p-6 shadow-soft ${dark ? 'border-slate-800 bg-slate-900/70' : 'border-slate-200 bg-white'}`}>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className={`text-sm ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Weekly Progress</p>
                <h2 className={`text-xl font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>Consistency is building momentum</h2>
              </div>
              <div className="rounded-full bg-brand-500/10 px-3 py-1 text-sm text-brand-300">+14% this week</div>
            </div>
            <div className="mt-6 flex h-40 items-end gap-3">
              {[45, 72, 68, 86, 81, 92, 88].map((height, index) => (
                <div key={index} className="flex-1 rounded-t-2xl bg-gradient-to-t from-brand-600 to-brand-400" style={{ height: `${height}%` }} />
              ))}
            </div>
          </div>

          <div className={`rounded-3xl border p-6 shadow-soft ${dark ? 'border-slate-800 bg-slate-900/70' : 'border-slate-200 bg-white'}`}>
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-2xl bg-brand-500/10 p-3 text-brand-300">
                <Briefcase className="h-5 w-5" />
              </div>
              <div>
                <p className={`text-sm ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Placement Progress</p>
                <h2 className={`text-xl font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>Strong momentum</h2>
              </div>
            </div>
            <div className="space-y-4">
              {tasks.map((task) => {
                const Icon = task.icon;
                return (
                  <div key={task.title} className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${dark ? 'border-slate-800 bg-slate-950/70' : 'border-slate-200 bg-slate-50'}`}>
                    <div className="rounded-xl bg-brand-500/10 p-2 text-brand-300">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className={`font-medium ${dark ? 'text-white' : 'text-slate-900'}`}>{task.title}</p>
                      <p className={`text-sm ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{task.detail}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
