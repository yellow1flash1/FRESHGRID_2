import { useState } from 'react';
import { TrendingUp, TrendingDown, Scale, IndianRupee } from 'lucide-react';
import { calcIncome, formatINR } from '@/lib/income';

export default function IncomePanel() {
  const [kg, setKg] = useState(1000);
  const [price, setPrice] = useState(30);

  const result = calcIncome(kg, price);

  return (
    <div className="space-y-4 animate-fade-up">
      <div className="card p-4 space-y-3">
        <div>
          <label className="label" htmlFor="kg">
            <span className="flex items-center gap-1.5"><Scale size={15} /> Harvest (kg)</span>
          </label>
          <input
            id="kg"
            type="number"
            min={50}
            value={kg}
            onChange={(e) => setKg(Math.max(0, Number(e.target.value)))}
            className="input"
          />
        </div>
        <div>
          <label className="label" htmlFor="pr">
            <span className="flex items-center gap-1.5"><IndianRupee size={15} /> Fair market price (₹/kg)</span>
          </label>
          <input
            id="pr"
            type="number"
            min={1}
            value={price}
            onChange={(e) => setPrice(Math.max(0, Number(e.target.value)))}
            className="input"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4">
          <div className="flex items-center gap-1.5 text-mute text-xs font-semibold mb-1">
            <TrendingDown size={14} /> Without FreshGrid
          </div>
          <div className="text-2xl font-extrabold text-alert">{formatINR(result.withoutFreshGrid)}</div>
          <p className="mt-1 text-xs text-mute">38% lost, mandi discount, full transport</p>
        </div>
        <div className="card p-4 border-2 border-forest-200">
          <div className="flex items-center gap-1.5 text-forest-600 text-xs font-semibold mb-1">
            <TrendingUp size={14} /> With FreshGrid
          </div>
          <div className="text-2xl font-extrabold text-forest-600">{formatINR(result.withFreshGrid)}</div>
          <p className="mt-1 text-xs text-mute">8% lost, pooled transport, fees included</p>
        </div>
      </div>

      <div className="card p-5 bg-forest-50 border-forest-200">
        <div className="text-2xl font-extrabold text-forest-700">
          {result.gainPct > 0 ? `+${result.gainPct}%` : '—'}
          <span className="text-sm font-semibold text-mute ml-2">net income difference</span>
        </div>
        <p className="mt-2 text-sm text-mute">
          Illustrative estimate from FreshGrid's assumptions, not a measured result.
          Payout arrives by UPI when the buyer scans the delivery QR.
        </p>
      </div>
    </div>
  );
}
