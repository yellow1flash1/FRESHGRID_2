import { useCallback, useEffect, useRef, useState } from 'react';
import { Send, Loader2, Sparkles } from 'lucide-react';
import { EDGE_URL, ANON_KEY } from '@/lib/supabase';
import type { ChatMessage } from '@/lib/types';

const SUGGESTIONS = [
  'How do I scan a crate?',
  'Find a cold room near me',
  'How is income calculated?',
  'What does Grade C mean?',
];

export default function ChatPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([
      {
        role: 'assistant',
        content:
          "Namaste! I'm the FreshGrid assistant. Ask me about scanning, cold rooms, payments, or your income — or tap a suggestion below.",
      },
    ]);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setInput('');
    setError(null);
    setMessages((m) => [...m, { role: 'user', content: trimmed }]);
    setSending(true);
    try {
      const res = await fetch(`${EDGE_URL}/chatbot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ANON_KEY}` },
        body: JSON.stringify({ message: trimmed }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || `Request failed (${res.status})`);
      setMessages((m) => [...m, { role: 'assistant', content: data.reply }]);
    } catch (e) {
      setError(String((e as Error).message));
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: 'Sorry, I could not reach the assistant right now. Please try again.' },
      ]);
    } finally {
      setSending(false);
    }
  }, [sending]);

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] min-h-[420px] animate-fade-up">
      <div className="card flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-parchment-300 bg-forest-50">
          <div className="w-9 h-9 rounded-full bg-forest-500 text-white flex items-center justify-center">
            <Sparkles size={18} />
          </div>
          <div>
            <h3 className="font-bold leading-tight">FreshGrid Assistant</h3>
            <p className="text-xs text-mute">Online — typically replies instantly</p>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-none">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-sm ${
                  m.role === 'user'
                    ? 'bg-forest-500 text-white rounded-br-sm'
                    : 'bg-parchment-50 border border-parchment-300 rounded-bl-sm'
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="bg-parchment-50 border border-parchment-300 rounded-2xl rounded-bl-sm px-4 py-3">
                <Loader2 size={18} className="animate-spin-slow text-forest-500" />
              </div>
            </div>
          )}
        </div>

        {messages.length <= 1 && (
          <div className="px-4 pb-2 flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="chip bg-forest-50 text-forest-700 hover:bg-forest-100 transition"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {error && <p className="px-4 pb-1 text-xs text-alert">{error}</p>}

        <div className="p-3 border-t border-parchment-300">
          <div className="flex gap-2">
            <input
              className="input flex-1"
              placeholder="Ask me anything…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send(input)}
              disabled={sending}
            />
            <button
              className="btn-brand w-auto px-4 py-2.5 flex items-center justify-center gap-1.5"
              onClick={() => send(input)}
              disabled={sending || !input.trim()}
            >
              {sending ? <Loader2 size={18} className="animate-spin-slow" /> : <Send size={18} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
