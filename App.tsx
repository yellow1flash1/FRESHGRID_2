import { useState } from 'react';
import { ScanLine, Snowflake, Wallet, MessageCircle, Sprout } from 'lucide-react';
import ScanPanel from '@/components/ScanPanel';
import HubPanel from '@/components/HubPanel';
import IncomePanel from '@/components/IncomePanel';
import ChatPanel from '@/components/ChatPanel';
import PaymentStatus from '@/components/PaymentStatus';

type Tab = 'scan' | 'hub' | 'income' | 'chat';

const TABS: { id: Tab; label: string; icon: typeof ScanLine }[] = [
  { id: 'scan', label: 'Scan crate', icon: ScanLine },
  { id: 'hub', label: 'Cold rooms', icon: Snowflake },
  { id: 'income', label: 'My income', icon: Wallet },
  { id: 'chat', label: 'Assistant', icon: MessageCircle },
];

export default function App() {
  const [tab, setTab] = useState<Tab>('scan');
  const [scanId, setScanId] = useState<string | null>(null);
  const [paymentView, setPaymentView] = useState<{ status: 'success' | 'cancelled'; sessionId?: string } | null>(null);

  // Parse hash-based payment return: #/payment/success?session_id=... or #/payment/cancelled
  if (typeof window !== 'undefined' && window.location.hash.startsWith('#/payment/') && !paymentView) {
    const hash = window.location.hash;
    const isSuccess = hash.includes('/success');
    const sessionId = new URLSearchParams(hash.split('?')[1] ?? '').get('session_id') ?? undefined;
    setPaymentView({ status: isSuccess ? 'success' : 'cancelled', sessionId });
  }

  if (paymentView) {
    return (
      <PaymentStatus
        status={paymentView.status}
        sessionId={paymentView.sessionId}
        onDone={() => {
          setPaymentView(null);
          window.location.hash = '';
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-parchment-50">
      <header className="sticky top-0 z-10 bg-parchment-50/85 backdrop-blur-md border-b border-parchment-300">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-forest-500 text-white flex items-center justify-center shadow-card">
            <Sprout size={22} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold leading-none font-display">FreshGrid</h1>
            <p className="text-xs text-mute mt-0.5">Scan · Store · Sell</p>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-4 pb-28">
        {tab === 'scan' && (
          <ScanPanel
            onFindColdRoom={() => setTab('hub')}
            onScanSaved={(id) => setScanId(id)}
          />
        )}
        {tab === 'hub' && <HubPanel pendingScanId={scanId} />}
        {tab === 'income' && <IncomePanel />}
        {tab === 'chat' && <ChatPanel />}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-10 bg-parchment-100/95 backdrop-blur-md border-t border-parchment-300">
        <div className="max-w-md mx-auto grid grid-cols-4">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex flex-col items-center gap-1 py-2.5 transition-all ${
                  active ? 'text-forest-600' : 'text-mute hover:text-ink'
                }`}
              >
                <Icon size={22} className={active ? 'scale-110' : ''} style={{ transition: 'transform 0.2s' }} />
                <span className="text-[11px] font-semibold">{t.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
