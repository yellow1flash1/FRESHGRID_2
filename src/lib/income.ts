export interface IncomeResult {
  withoutFreshGrid: number;
  withFreshGrid: number;
  gainPct: number;
}

export function calcIncome(kg: number, pricePerKg: number): IncomeResult {
  const without = kg * 0.62 * pricePerKg * 0.85 - kg * 4;
  const withFG = kg * 0.92 * pricePerKg * 0.88 - kg * 1.5 - kg * 2.4;
  const gainPct = without > 0 ? Math.round(((withFG - without) / without) * 100) : 0;
  return { withoutFreshGrid: without, withFreshGrid: withFG, gainPct };
}

export function formatINR(n: number): string {
  const rounded = Math.round(n);
  const sign = rounded < 0 ? '-' : '';
  const abs = Math.abs(rounded);
  return `${sign}₹${abs.toLocaleString('en-IN')}`;
}
