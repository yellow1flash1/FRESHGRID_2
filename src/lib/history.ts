import type { HistoryEntry } from './types';

const HISTORY_KEY = 'freshgrid_scan_history';
const MAX_ENTRIES = 200;

export function getHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as HistoryEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addHistoryEntry(entry: HistoryEntry): void {
  const history = getHistory();
  history.unshift(entry);
  if (history.length > MAX_ENTRIES) {
    history.length = MAX_ENTRIES;
  }
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {
    // localStorage might be full (photos are large) — try saving without photos
    const trimmed = history.map((e) => ({ ...e, photo: null }));
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
    } catch {
      // give up silently
    }
  }
}

export function clearHistory(): void {
  localStorage.removeItem(HISTORY_KEY);
}

export function deleteHistoryEntry(id: string): void {
  const history = getHistory().filter((e) => e.id !== id);
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {
    const trimmed = history.map((e) => ({ ...e, photo: null }));
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
    } catch {
      // give up
    }
  }
}

export function exportHistoryCSV(): void {
  const history = getHistory();
  if (history.length === 0) return;

  const headers = [
    'Timestamp',
    'Crop',
    'Ripeness (%)',
    'Bruising (%)',
    'Grade',
    'Shelf Life (h)',
    'Cold Life (h)',
    'Quality Score',
    'Location',
    'Latitude',
    'Longitude',
    'Route',
  ];

  const rows = history.map((e) => [
    new Date(e.timestamp).toLocaleString('en-IN'),
    e.crop,
    e.ripeness,
    e.bruising,
    e.grade,
    e.shelfLifeHours,
    e.coldLifeHours,
    e.score,
    e.location ?? '',
    e.lat ?? '',
    e.lon ?? '',
    `"${e.route.replace(/"/g, '""')}"`,
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `freshgrid-inspection-log-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
