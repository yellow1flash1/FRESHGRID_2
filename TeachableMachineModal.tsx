import { useState } from 'react';
import { X, Link2, Trash2, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { getTMModelUrl, setTMModelUrl, clearTMModelUrl, hasTMModel } from '@/lib/aiScanner';

interface TeachableMachineModalProps {
  onClose: () => void;
}

export default function TeachableMachineModal({ onClose }: TeachableMachineModalProps) {
  const [url, setUrl] = useState(getTMModelUrl() ?? '');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const connected = hasTMModel();

  const handleSave = () => {
    const trimmed = url.trim();
    if (trimmed && !trimmed.startsWith('https://')) {
      setError('Model URL must start with https:// — copy the link from Teachable Machine\'s "Upload" panel.');
      return;
    }
    if (trimmed) {
      setTMModelUrl(trimmed.endsWith('/') ? trimmed : trimmed + '/');
    } else {
      clearTMModelUrl();
    }
    setSaved(true);
    setError(null);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleClear = () => {
    clearTMModelUrl();
    setUrl('');
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 animate-fade-in" onClick={onClose}>
      <div
        className="card w-full max-w-md rounded-t-3xl sm:rounded-2xl p-6 animate-slide-up sm:animate-scale-in max-h-[90vh] overflow-y-auto scrollbar-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-extrabold font-display">AI Scanner Settings</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-parchment-200 flex items-center justify-center transition">
            <X size={18} />
          </button>
        </div>

        <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-forest-50 border border-forest-100">
          {connected ? (
            <>
              <CheckCircle2 size={20} className="text-forest-500 shrink-0" />
              <p className="text-sm font-semibold text-forest-700">Teachable Machine model is connected and active.</p>
            </>
          ) : (
            <>
              <Info size={20} className="text-gold-500 shrink-0" />
              <p className="text-sm font-semibold text-gold-700">Demo mode active. Connect a model for AI-powered classification.</p>
            </>
          )}
        </div>

        <label className="label" htmlFor="tm-url">Teachable Machine Model URL</label>
        <div className="relative">
          <Link2 size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-mute" />
          <input
            id="tm-url"
            type="url"
            placeholder="https://teachablemachine.withgoogle.com/models/..."
            value={url}
            onChange={(e) => { setUrl(e.target.value); setError(null); }}
            className="input pl-10"
          />
        </div>
        <p className="mt-2 text-xs text-mute leading-relaxed">
          Train your model on Teachable Machine, click "Upload", then copy the shared link here.
          The scanner will automatically use your model for all future scans.
        </p>

        {error && (
          <div className="mt-3 flex items-start gap-2 p-3 rounded-lg bg-alert/10 text-alert text-sm">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {saved && (
          <div className="mt-3 flex items-center gap-2 p-3 rounded-lg bg-forest-50 text-forest-700 text-sm font-semibold animate-fade-in">
            <CheckCircle2 size={16} /> Settings saved successfully.
          </div>
        )}

        <div className="flex gap-2 mt-4">
          <button className="btn-brand flex-1" onClick={handleSave}>
            Save model URL
          </button>
          {connected && (
            <button
              className="btn-ghost px-4 py-3.5 w-auto flex items-center gap-1.5"
              onClick={handleClear}
            >
              <Trash2 size={16} /> Disconnect
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
