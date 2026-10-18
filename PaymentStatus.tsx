import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface PaymentStatusProps {
  status: 'success' | 'cancelled';
  sessionId?: string;
  onDone: () => void;
}

export default function PaymentStatus({ status, sessionId, onDone }: PaymentStatusProps) {
  const [verifying, setVerifying] = useState(status === 'success');
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (status !== 'success' || !sessionId) return;
    let cancelled = false;
    (async () => {
      try {
        await supabase
          .from('orders')
          .update({ status: 'paid' })
          .eq('stripe_session_id', sessionId);
        if (!cancelled) {
          setConfirmed(true);
          setVerifying(false);
        }
      } catch {
        if (!cancelled) setVerifying(false);
      }
    })();
    return () => { cancelled = true; };
  }, [status, sessionId]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="card p-8 max-w-md w-full text-center animate-fade-up">
        {status === 'success' ? (
          <>
            {verifying ? (
              <>
                <Loader2 size={56} className="mx-auto animate-spin-slow text-forest-500" />
                <h2 className="mt-4 text-xl font-extrabold">Confirming payment…</h2>
                <p className="mt-1 text-mute text-sm">Talking to Stripe — just a moment.</p>
              </>
            ) : (
              <>
                <CheckCircle2 size={64} className="mx-auto text-forest-500" />
                <h2 className="mt-3 text-2xl font-extrabold">Payment {confirmed ? 'confirmed' : 'received'}!</h2>
                <p className="mt-2 text-mute text-sm">
                  Your cold-room slot is reserved. You'll get a pickup confirmation by SMS.
                </p>
              </>
            )}
          </>
        ) : (
          <>
            <XCircle size={64} className="mx-auto text-alert" />
            <h2 className="mt-3 text-2xl font-extrabold">Payment cancelled</h2>
            <p className="mt-2 text-mute text-sm">No charge was made. You can try again anytime.</p>
          </>
        )}
        <button className="btn-primary mt-6" onClick={onDone}>
          Back to FreshGrid
        </button>
      </div>
    </div>
  );
}
