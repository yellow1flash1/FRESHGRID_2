import { useCallback, useState } from 'react';
import { Download, Trash2, Clock, MapPin, X } from 'lucide-react';
import { getHistory, deleteHistoryEntry, clearHistory, exportHistoryCSV } from '@/lib/history';
import type { HistoryEntry } from '@/lib/types';

interface ScanHistoryProps {
  onClose: () => void;
}

export default function ScanHistory({ onClose }: ScanHistoryProps) {
  const [history, setHistory] = useState<HistoryEntry[]>(getHistory());
  const [selected, setSelected] = useState<HistoryEntry | null>(null);

  const refresh = useCallback(() => setHistory(getHistory()), []);

  const handleDelete = (id: string) => {
    deleteHistoryEntry(id);
    refresh();
  };

  const handleClearAll = () => {
    clearHistory();
    refresh();
  };

  const gradeColor: Record<string, string> = {
    A: 'text-forest-500',
    B: 'text-gold-600',
    C: 'text-alert',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 animate-fade-in" onClick={onClose}>
      <div
        className="card w-full max-w-md rounded-t-3xl sm:rounded-2xl p-6 animate-slide-up sm:animate-scale-in max-h-[90vh] overflow-y-auto scrollbar-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-extrabold font-display">Scan History</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-parchment-200 flex items-center justify-center transition">
            <X size={18} />
          </button>
        </div>

        {history.length === 0 ? (
          <div className="text-center py-8 text-mute text-sm">
            No scans saved yet. Scan a crate to start building your inspection log.
          </div>
        ) : (
          <>
            <div className="flex gap-2 mb-4">
              <button
                onClick={exportHistoryCSV}
                className="btn-brand flex-1 flex items-center justify-center gap-2"
              >
                <Download size={16} /> Export CSV
              </button>
              <button
                onClick={handleClearAll}
                className="btn-ghost px-4 py-3.5 w-auto flex items-center gap-2 text-alert border-alert"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className="space-y-2">
              {history.map((entry) => (
                <div key={entry.id} className="card p-3 flex gap-3">
                  {entry.photo ? (
                    <img src={entry.photo} alt="Scan" className="w-16 h-16 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-parchment-200 flex items-center justify-center shrink-0 text-2xl">
                      🥬
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-lg font-extrabold ${gradeColor[entry.grade] ?? ''}`}>{entry.grade}</span>
                      <span className="font-semibold text-sm truncate">{entry.crop}</span>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="ml-auto text-mute hover:text-alert transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-mute mt-1">
                      <Clock size={11} /> {new Date(entry.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                    {entry.location && (
                      <div className="flex items-center gap-1 text-xs text-mute mt-0.5">
                        <MapPin size={11} /> {entry.location}
                      </div>
                    )}
                    <div className="text-xs text-mute mt-0.5">
                      Shelf life: {entry.shelfLifeHours}h · Cold: {entry.coldLifeHours}h · Score: {entry.score}
                    </div>
                    <button
                      onClick={() => setSelected(entry)}
                      className="text-xs font-semibold text-forest-600 hover:underline mt-1"
                    >
                      View details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in p-4" onClick={() => setSelected(null)}>
            <div className="card p-5 max-w-sm w-full animate-scale-in" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold">Scan Details</h3>
                <button onClick={() => setSelected(null)} className="w-7 h-7 rounded-full hover:bg-parchment-200 flex items-center justify-center">
                  <X size={16} />
                </button>
              </div>
              {selected.photo && (
                <img src={selected.photo} alt="Scan" className="w-full rounded-lg mb-3" />
              )}
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-mute">Crop</span><span className="font-semibold">{selected.crop}</span></div>
                <div className="flex justify-between"><span className="text-mute">Grade</span><span className={`font-extrabold ${gradeColor[selected.grade]}`}>{selected.grade}</span></div>
                <div className="flex justify-between"><span className="text-mute">Ripeness</span><span className="font-semibold">{selected.ripeness}%</span></div>
                <div className="flex justify-between"><span className="text-mute">Bruising</span><span className="font-semibold">{selected.bruising}%</span></div>
                <div className="flex justify-between"><span className="text-mute">Shelf life</span><span className="font-semibold">{selected.shelfLifeHours} h</span></div>
                <div className="flex justify-between"><span className="text-mute">Cold life</span><span className="font-semibold">{selected.coldLifeHours} h</span></div>
                <div className="flex justify-between"><span className="text-mute">Score</span><span className="font-semibold">{selected.score}/100</span></div>
                {selected.location && (
                  <div className="flex justify-between"><span className="text-mute">Location</span><span className="font-semibold text-right">{selected.location}</span></div>
                )}
                <div className="pt-2 border-t border-parchment-200">
                  <p className="text-xs text-mute">{selected.route}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
