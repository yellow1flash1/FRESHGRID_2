export type Grade = 'A' | 'B' | 'C';

export interface Scan {
  id: string;
  crop: string;
  ripeness: number;
  bruising: number;
  grade: Grade;
  shelf_life_hours: number;
  photo_url: string | null;
  created_at: string;
}

export interface ColdHub {
  id: string;
  name: string;
  lat: number;
  lon: number;
  distance_km: number;
  price_per_crate_per_day: number;
  slots_free: number;
  tags: string[];
}

export interface Booking {
  id: string;
  scan_id: string | null;
  hub_name: string;
  hub_lat: number | null;
  hub_lon: number | null;
  hub_distance_km: number | null;
  crates: number;
  days: number;
  price_per_crate_per_day: number;
  total: number;
  status: string;
  created_at: string;
}

export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
}

export const CROPS = [
  { name: 'Tomato', baseHours: 48, emoji: '🍅' },
  { name: 'Green beans', baseHours: 72, emoji: '🫛' },
  { name: 'Mango', baseHours: 96, emoji: '🥭' },
  { name: 'Papaya', baseHours: 60, emoji: '🟧' },
  { name: 'Banana', baseHours: 120, emoji: '🍌' },
  { name: 'Spinach', baseHours: 36, emoji: '🥬' },
] as const;

export type CropName = (typeof CROPS)[number]['name'];

// --- New types for extended features ---

export interface StorageGuideEntry {
  name: string;
  emoji: string;
  tempC: string;
  humidity: string;
  roomTempHours: number;
  coldStorageHours: number;
  notes: string;
}

export interface HistoryEntry {
  id: string;
  timestamp: string;
  crop: string;
  ripeness: number;
  bruising: number;
  grade: Grade;
  shelfLifeHours: number;
  coldLifeHours: number;
  score: number;
  route: string;
  photo: string | null;
  location: string | null;
  lat: number | null;
  lon: number | null;
}

export interface AIScanResult {
  label: string;
  confidence: number;
  ripeness: number;
  bruising: number;
  note: string;
}

export type FacingMode = 'user' | 'environment';
