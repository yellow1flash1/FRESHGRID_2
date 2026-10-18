import { useState } from 'react';
import { Snowflake, Thermometer, Droplets, Clock, TrendingUp, IndianRupee } from 'lucide-react';
import { STORAGE_GUIDE, calcSpoilage } from '@/lib/storageGuide';
import { formatINR } from '@/lib/income';

export default function StorageGuide() {
  const [selected, setSelected] = useState(STORAGE_GUIDE[0]);
  const [weightKg, setWeightKg] = useState(100);
  const [unit, setUnit] = useState<'kg' | 'quintal'>('kg');
  const [pricePerKg, setPricePerKg] = useState(25);
  const [days, setDays] = useState(5);
  const [coldCostPerDay, setColdCostPerDay] = useState(15);

  const actualKg = unit === 'quintal' ? weightKg * 100 : weightKg;
  const result = calcSpoilage(actualKg, pricePerKg, days, coldCostPerDay);

  return (
    <div className="space-y-4 animate-fade-up">
      <div className="card p-4">
        <h2 className="font-extrabold text-lg font-display mb-3">Vegetable Cold Storage Guide</h2>
        <div className="grid grid-cols-4 gap-2 mb-4">
          {STORAGE_GUIDE.map((v) => (
            <button
              key={v.name}
              onClick={() => setSelected(v)}
              className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                selected.name === v.name
                  ? 'border-forest-500 bg-forest-50 text-forest-700'
                  : 'border-parchment-300 bg-parchment-50 text-mute hover:border-forest-200'
              }`}
            >
              <span className="text-lg">{v.emoji}</span>
              <span className="text-center leading-tight">{v.name}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="card p-3 text-center">
            <Thermometer size={20} className="mx-auto text-forest-500 mb-1" />
            <div className="text-sm font-bold">{selected.tempC}</div>
            <div className="text-xs text-mute">Temperature</div>
          </div>
          <div className="card p-3 text-center">
            <Droplets size={20} className="mx-auto text-gold-500 mb-1" />
            <div className="text-sm font-bold">{selected.humidity}</div>
            <div className="text-xs text-mute">Humidity</div>
          </div>
          <div className="card p-3 text-center">
            <Snowflake size={20} className="mx-auto text-forest-500 mb-1" />
            <div className="text-sm font-bold">{Math.round(selected.coldStorageHours / 24)}d</div>
            <div className="text-xs text-mute">Cold life</div>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-3 p-3 rounded-lg bg-parchment-50 border border-parchment-200">
          <Clock size={16} className="text-mute shrink-0" />
          <div className="text-sm">
            <span className="font-semibold">Room temp:</span> ~{Math.round(selected.roomTempHours / 24)} days
            <span className="mx-2 text-mute">→</span>
            <span className="font-semibold text-forest-600">Cold storage:</span> ~{Math.round(selected.coldStorageHours / 24)} days
            <span className="ml-2 chip bg-forest-50 text-forest-700">
              +{Math.round((selected.coldStorageHours / selected.roomTempHours - 1) * 100)}% longer
            </span>
          </div>
        </div>

        <p className="mt-2 text-xs text-mute leading-relaxed">{selected.notes}</p>
      </div>

      <div className="card p-4">
        <h2 className="font-extrabold text-lg font-display mb-3">Spoilage Risk & Batch Cost Calculator</h2>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="wt">Batch weight</label>
              <input
                id="wt"
                type="number"
                min={1}
                value={weightKg}
                onChange={(e) => setWeightKg(Math.max(0, Number(e.target.value)))}
                className="input"
              />
            </div>
            <div>
              <label className="label" htmlFor="unit">Unit</label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => setUnit('kg')}
                  className={`py-2.5 rounded-lg text-sm font-bold border transition ${
                    unit === 'kg' ? 'border-forest-500 bg-forest-50 text-forest-700' : 'border-parchment-300 text-mute'
                  }`}
                >
                  kg
                </button>
                <button
                  onClick={() => setUnit('quintal')}
                  className={`py-2.5 rounded-lg text-sm font-bold border transition ${
                    unit === 'quintal' ? 'border-forest-500 bg-forest-50 text-forest-700' : 'border-parchment-300 text-mute'
                  }`}
                >
                  quintal
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="ppk">
                <span className="flex items-center gap-1"><IndianRupee size={14} /> Price per kg (₹)
              </span></label>
              <input
                id="ppk"
                type="number"
                min={1}
                value={pricePerKg}
                onChange={(e) => setPricePerKg(Math.max(0, Number(e.target.value)))}
                className="input"
              />
            </div>
            <div>
              <label className="label" htmlFor="dys">Storage days</label>
              <input
                id="dys"
                type="number"
                min={1}
                max={30}
                value={days}
                onChange={(e) => setDays(Math.max(1, Number(e.target.value)))}
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="ccd">Cold storage cost/day (₹)</label>
            <input
              id="ccd"
              type="number"
              min={0}
              value={coldCostPerDay}
              onChange={(e) => setColdCostPerDay(Math.max(0, Number(e.target.value)))}
              className="input"
            />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="card p-3">
            <div className="text-xs font-semibold text-alert mb-1">At room temperature</div>
            <div className="text-xl font-extrabold text-alert">{formatINR(result.roomTempValueLost)}</div>
            <div className="text-xs text-mute mt-0.5">estimated value lost to spoilage</div>
          </div>
          <div className="card p-3 border-2 border-forest-200">
            <div className="text-xs font-semibold text-forest-600 mb-1">In cold storage</div>
            <div className="text-xl font-extrabold text-forest-600">{formatINR(result.coldStorageValueLost)}</div>
            <div className="text-xs text-mute mt-0.5">spoilage reduced by {result.spoilageReductionPct}%</div>
          </div>
        </div>

        <div className="mt-3 card p-4 bg-forest-50 border-forest-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-mute">Cold storage cost ({days} days)</span>
            <span className="font-bold text-mute">{formatINR(result.coldStorageCost)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold flex items-center gap-1.5">
              <TrendingUp size={16} className="text-forest-600" /> Net benefit
            </span>
            <span className={`text-2xl font-extrabold ${result.netBenefit > 0 ? 'text-forest-600' : 'text-alert'}`}>
              {formatINR(result.netBenefit)}
            </span>
          </div>
          <p className="mt-2 text-xs text-mute">
            Based on {actualKg.toLocaleString('en-IN')} kg at ₹{pricePerKg}/kg over {days} days.
            Moving to cold storage saves {formatINR(result.valueSaved)} in spoilage alone.
          </p>
        </div>
      </div>
    </div>
  );
}
