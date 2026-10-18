import type { StorageGuideEntry } from './types';

export const STORAGE_GUIDE: StorageGuideEntry[] = [
  { name: 'Potato', emoji: '🥔', tempC: '4–10°C', humidity: '90–95%', roomTempHours: 720, coldStorageHours: 4320, notes: 'Keep in dark. Do not refrigerate below 4°C — sugars form.' },
  { name: 'Tomato', emoji: '🍅', tempC: '12–15°C', humidity: '85–90%', roomTempHours: 48, coldStorageHours: 240, notes: 'Ripe tomatoes store longer at 12–15°C. Below 10°C causes chill damage.' },
  { name: 'Onion', emoji: '🧅', tempC: '0–2°C', humidity: '65–70%', roomTempHours: 720, coldStorageHours: 4320, notes: 'Cure before storage. Low humidity prevents sprouting and rot.' },
  { name: 'Leafy Greens', emoji: '🥬', tempC: '0–1°C', humidity: '95–98%', roomTempHours: 36, coldStorageHours: 336, notes: 'Highly perishable. Store unwashed, in perforated bags.' },
  { name: 'Carrot', emoji: '🥕', tempC: '0–1°C', humidity: '98–100%', roomTempHours: 120, coldStorageHours: 2880, notes: 'Remove green tops before storage. High humidity prevents wilting.' },
  { name: 'Cauliflower', emoji: '🥦', tempC: '0–1°C', humidity: '90–95%', roomTempHours: 72, coldStorageHours: 720, notes: 'Wrap in plastic film to prevent browning.' },
  { name: 'Cabbage', emoji: '🥬', tempC: '0–1°C', humidity: '98–100%', roomTempHours: 96, coldStorageHours: 1440, notes: 'Store whole, unwashed. Remove outer leaves before use.' },
  { name: 'Green Beans', emoji: '🫛', tempC: '4–7°C', humidity: '95%', roomTempHours: 72, coldStorageHours: 432, notes: 'Sensitive to chilling. Store in perforated plastic bags.' },
  { name: 'Mango', emoji: '🥭', tempC: '10–13°C', humidity: '85–90%', roomTempHours: 96, coldStorageHours: 480, notes: 'Ripe mangoes at 10–13°C. Below 8°C causes chill injury.' },
  { name: 'Banana', emoji: '🍌', tempC: '13–15°C', humidity: '90–95%', roomTempHours: 120, coldStorageHours: 504, notes: 'Never below 13°C. Ethylene sensitive — store away from other fruits.' },
  { name: 'Papaya', emoji: '🟧', tempC: '7–13°C', humidity: '85–90%', roomTempHours: 60, coldStorageHours: 336, notes: 'Ripen at room temp, then store at 7–10°C.' },
  { name: 'Spinach', emoji: '🥬', tempC: '0–1°C', humidity: '95–98%', roomTempHours: 36, coldStorageHours: 240, notes: 'Wash just before use. Store in ventilated plastic bags.' },
];

/**
 * Spoilage risk & batch cost calculator.
 * Estimates the value saved by moving produce to cold storage.
 */
export interface SpoilageCalcResult {
  roomTempValueLost: number;
  coldStorageValueLost: number;
  valueSaved: number;
  spoilageReductionPct: number;
  coldStorageCost: number;
  netBenefit: number;
}

export function calcSpoilage(
  weightKg: number,
  pricePerKg: number,
  daysStored: number,
  coldStorageCostPerDay: number,
): SpoilageCalcResult {
  // Spoilage rate: ~3% per day at room temp, ~0.3% per day in cold storage
  const roomTempLossRate = 0.03;
  const coldStorageLossRate = 0.003;

  const roomTempValueLost = weightKg * pricePerKg * roomTempLossRate * daysStored;
  const coldStorageValueLost = weightKg * pricePerKg * coldStorageLossRate * daysStored;
  const valueSaved = roomTempValueLost - coldStorageValueLost;
  const coldStorageCost = coldStorageCostPerDay * daysStored;
  const netBenefit = valueSaved - coldStorageCost;
  const spoilageReductionPct = Math.round(((roomTempLossRate - coldStorageLossRate) / roomTempLossRate) * 100);

  return {
    roomTempValueLost: Math.round(roomTempValueLost),
    coldStorageValueLost: Math.round(coldStorageValueLost),
    valueSaved: Math.round(valueSaved),
    spoilageReductionPct,
    coldStorageCost: Math.round(coldStorageCost),
    netBenefit: Math.round(netBenefit),
  };
}
