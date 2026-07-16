import { motion } from 'framer-motion';
import { ArrowRight, Brain, BriefcaseBusiness, ShieldCheck, Sparkles, CheckCircle2, PlayCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const logos = ['Infosys', 'TCS', 'Wipro', 'Capgemini', 'Cognizant', 'Accenture'];
const features = [
  {
    title: 'Resume Intelligence',
    description: 'Get ATS-ready feedback and actionable skill insights from your resume.',
    icon: Brain,
  },
  {
    title: 'Placement Focused Prep',
    description: 'Train with company-specific aptitude, technical, and communication modules.',
    icon: BriefcaseBusiness,
  },
  {
    title: 'Secure AI Guidance',
    description: 'Use private and trustworthy AI support for mock interviews and mentor coaching.',
    icon: ShieldCheck,
  },
];

const testimonials = [
  {
    quote: 'CareerPilot AI helped me turn scattered prep into a real strategy. My readiness improved fast.',
    name: 'Ananya P.',
    role: 'Computer Science Student',
  },
  {
    quote: 'The mock interviews felt very close to real recruiter conversations. It gave me confidence.',
    name: 'Rohan S.',
    role: 'Information Technology Student',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.18),_transparent_45%)] text-slate-100">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-8">
        <div className="flex items-center gap-3 text-xl font-semibold">
          <div className="rounded-xl border border-brand-500/30 bg-brand-500/10 p-2">
            <Sparkles className="h-5 w-5 text-brand-100" />
          </div>
          CareerPilot AI
        </div>
        <nav className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
          <a href="#features" className="transition hover:text-white">Features</a>
          <a href="#testimonials" className="transition hover:text-white">Testimonials</a>
          <Link to="/login" className="rounded-full border border-slate-700 px-4 py-2 transition hover:border-brand-500 hover:text-white">Login</Link>
        </nav>
      </header>

      <main>
        <section className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-16 lg:grid-cols-2 lg:px-8 lg:py-24">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-sm text-brand-100">
              <Sparkles className="h-4 w-4" />
              AI-powered placement preparation for ambitious students
            </div>
            <h1 className="text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
              Prepare smarter for placements with intelligent AI guidance.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-slate-300">
              From resume scoring to mock interviews and company-specific preparation, CareerPilot AI helps students move from uncertainty to placement readiness with confidence.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/register" className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-6 py-3 font-medium text-white transition hover:bg-brand-700">
                Get Started <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#features" className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-6 py-3 font-medium text-slate-200 transition hover:border-brand-500 hover:text-white">
                <PlayCircle className="h-4 w-4" /> See Features
              </a>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-soft backdrop-blur">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Placement readiness</p>
                  <p className="text-3xl font-semibold text-white">82%</p>
                </div>
                <div className="rounded-full bg-emerald-500/15 px-3 py-1 text-sm text-emerald-400">On Track</div>
              </div>
              <div className="space-y-4">
                {[
                  { label: 'Resume Score', value: '91/100' },
                  { label: 'Aptitude Streak', value: '5 days' },
                  { label: 'Mock Interviews', value: '3 completed' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3">
                    <span className="text-slate-400">{item.label}</span>
                    <span className="font-medium text-white">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </section>

        <section className="border-y border-slate-800 bg-slate-900/50 py-8">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-6 px-6 text-sm text-slate-400 lg:px-8">
            <span className="font-medium uppercase tracking-[0.3em] text-slate-500">Trusted by aspiring talent at</span>
            {logos.map((logo) => (
              <div key={logo} className="rounded-full border border-slate-800 bg-slate-950/60 px-4 py-2 text-slate-300">{logo}</div>
            ))}
          </div>
        </section>

        <section id="features" className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="mb-12 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-300">Features</p>
            <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">Everything you need to crack placements with confidence</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <motion.div key={feature.title} whileHover={{ y: -4 }} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-soft">
                  <div className="mb-4 inline-flex rounded-xl bg-brand-500/10 p-3 text-brand-200">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-400">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </section>

        <section id="testimonials" className="mx-auto max-w-7xl px-6 pb-20 lg:px-8">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8 shadow-soft">
            <div className="mb-8 text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-300">Testimonials</p>
              <h2 className="mt-4 text-3xl font-semibold text-white">Students are turning preparation into progress</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {testimonials.map((item) => (
                <div key={item.name} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6">
                  <div className="mb-4 flex items-center gap-2 text-brand-300">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <CheckCircle2 key={index} className="h-4 w-4" />
                    ))}
                  </div>
                  <p className="text-slate-300">“{item.quote}”</p>
                  <div className="mt-6">
                    <p className="font-semibold text-white">{item.name}</p>
                    <p className="text-sm text-slate-400">{item.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-800 bg-slate-950/80">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-8 text-sm text-slate-400 md:flex-row md:items-center md:justify-between lg:px-8">
          <p>© 2026 CareerPilot AI. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="transition hover:text-white">Privacy</a>
            <a href="#" className="transition hover:text-white">Terms</a>
            <a href="#" className="transition hover:text-white">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
