import type { Grade, CropName } from './types';
import { CROPS } from './types';

export interface ScanInput {
  crop: CropName;
  ripeness: number;
  bruising: number;
}

export interface ScanResult {
  grade: Grade;
  shelfLifeHours: number;
  coldLifeHours: number;
  score: number;
  route: string;
}

export function analyzeCrate(input: ScanInput): ScanResult {
  const base = CROPS.find((c) => c.name === input.crop)?.baseHours ?? 48;
  const { ripeness, bruising } = input;

  const score = Math.max(0, 100 - bruising * 0.9 - Math.abs(ripeness - 45) * 0.5);
  const shelfLifeHours = Math.max(
    6,
    Math.round(base * (1 - bruising / 120) * (1 - Math.max(0, ripeness - 50) / 90))
  );
  const coldLifeHours = Math.round(shelfLifeHours * 3);

  const grade: Grade =
    score >= 75 && shelfLifeHours >= 36 ? 'A' : shelfLifeHours < 36 || score < 45 ? 'C' : 'B';

  const route =
    grade === 'A'
      ? 'Grade A — list on the B2B marketplace with a digital quality certificate.'
      : grade === 'B'
        ? 'Grade B — split into fractional crates and store at the nearest micro-cold hub.'
        : 'Grade C (under 36 h left) — flash rescue sale to ketchup, puree & dehydration plants.';

  return { grade, shelfLifeHours, coldLifeHours, score, route };
}
