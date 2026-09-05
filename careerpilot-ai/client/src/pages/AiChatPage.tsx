import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User } from 'lucide-react';
import apiClient from '../services/apiClient';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  suggestedAction?: string;
}

export default function AiChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 'welcome', role: 'assistant', text: 'Hello! I\'m your CareerPilot AI assistant. Ask me about careers, skills, roadmaps, or job preparation.' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setError(null);
    setLoading(true);
    try {
      const resp = await apiClient.post('/api/v1/ai/ai-chat', { message: text, context: {} });
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: resp.response || 'I\'m not sure how to help with that yet.',
        suggestedAction: resp.suggested_action,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', text: 'Sorry, I encountered an error. Please try again.' }]);
      setError('Unable to get a response right now.');
    } finally {
      setLoading(false);
    }
  }

  function handleSuggestedAction(action?: string) {
    if (!action) return;
    const routes: Record<string, string> = {
      'career-matching': '/careers',
      'skill-gap-enhanced': '/skill-gap',
      'roadmap': '/roadmap',
      'project-recommendations': '/projects',
      'interview-questions': '/interview-coach',
      'resume-analysis': '/resume-analyzer',
    };
    const path = routes[action];
    if (path) window.location.href = path;
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-slate-950 text-slate-100">
      <div className="mx-auto w-full max-w-3xl px-6 py-6 lg:px-8">
        <header className="mb-6 rounded-3xl border border-slate-800 bg-slate-900/70 px-5 py-4 shadow-soft backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-brand-500/10 p-3 text-brand-300">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-slate-400">AI Assistant</p>
              <h1 className="text-2xl font-semibold text-white">Career Chat</h1>
            </div>
          </div>
        </header>

        {error && <div className="mb-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</div>}

        <div className="flex-1 space-y-4 overflow-y-auto rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-soft">
          <AnimatePresence>
            {messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role === 'assistant' && (
                  <div className="rounded-xl bg-brand-500/10 p-2 text-brand-300">
                    <Bot className="h-4 w-4" />
                  </div>
                )}
                <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${m.role === 'user' ? 'bg-brand-600 text-white' : 'bg-slate-950 text-slate-300'}`}>
                  <p>{m.text}</p>
                  {m.suggestedAction && (
                    <button
                      onClick={() => handleSuggestedAction(m.suggestedAction)}
                      className="mt-2 rounded-full border border-brand-500/30 px-3 py-1 text-xs text-brand-300 hover:bg-brand-500/10"
                    >
                      Go to {m.suggestedAction.replace(/-/g, ' ')}
                    </button>
                  )}
                </div>
                {m.role === 'user' && (
                  <div className="rounded-xl bg-slate-800 p-2 text-slate-300">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="rounded-xl bg-brand-500/10 p-2 text-brand-300"><Bot className="h-4 w-4" /></div>
              <div className="rounded-2xl bg-slate-950 px-4 py-2 text-sm text-slate-400">Thinking...</div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="mt-4 flex gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-100 outline-none focus:border-brand-500"
            placeholder="Ask about careers, skills, roadmaps..."
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="rounded-full bg-brand-600 p-2 text-white transition hover:bg-brand-500 disabled:opacity-50"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
