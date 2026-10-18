import { useCallback, useEffect, useState } from 'react';
import { Sparkles, Thermometer, Settings, History, BookOpen, MapPin } from 'lucide-react';
import { CROPS, type CropName, type Grade, type HistoryEntry } from '@/lib/types';
import { analyzeCrate } from '@/lib/scan';
import { analyzeProduce, hasTMModel } from '@/lib/aiScanner';
import { supabase } from '@/lib/supabase';
import { addHistoryEntry } from '@/lib/history';
import { getCurrentPosition, reverseGeocode } from '@/lib/location';
import Camera from '@/components/Camera';
import TeachableMachineModal from '@/components/TeachableMachineModal';
import ScanHistory from '@/components/ScanHistory';
import StorageGuide from '@/components/StorageGuide';

interface ScanPanelProps {
  onFindColdRoom: () => void;
  onScanSaved: (scanId: string) => void;
}

type ScanView = 'scan' | 'guide';

export default function ScanPanel({ onFindColdRoom, onScanSaved }: ScanPanelProps) {
  const [view, setView] = useState<ScanView>('scan');
  const [showTMModal, setShowTMModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Scan state
  const [crop, setCrop] = useState<CropName>('Tomato');
  const [ripeness, setRipeness] = useState(50);
  const [bruising, setBruising] = useState(15);
  const [photoNote, setPhotoNote] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ReturnType<typeof analyzeCrate> | null>(null);
  const [aiLabel, setAiLabel] = useState<string | null>(null);
  const [tmConnected, setTmConnected] = useState(hasTMModel());
  const [locationName, setLocationName] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);

  // Try to get location on mount (best-effort)
  useEffect(() => {
    getCurrentPosition()
      .then(async (loc) => {
        setCoords({ lat: loc.lat, lon: loc.lon });
        const rg = await reverseGeocode(loc.lat, loc.lon);
        const shortName = rg.city ?? rg.village ?? null;
        if (shortName) setLocationName(shortName);
      })
      .catch(() => {
        // silent — location is optional
      });
  }, []);

  const handleCapture = useCallback(async (dataUrl: string) => {
    setCapturedImage(dataUrl);
    setScanning(true);
    setPhotoNote(null);
    setAiLabel(null);

    const img = new Image();
    img.onload = async () => {
      // Run AI analysis (TM model if connected, otherwise demo)
      const aiResult = await analyzeProduce(img);
      setRipeness(aiResult.ripeness);
      setBruising(aiResult.bruising);
      setPhotoNote(aiResult.note);
      setAiLabel(`${aiResult.label} · ${aiResult.confidence}% confidence`);
      setScanning(false);
    };
    img.onerror = () => {
      setRipeness(50);
      setBruising(15);
      setPhotoNote('Could not load the captured image. Adjust the sliders manually.');
      setScanning(false);
    };
    img.src = dataUrl;
  }, []);

  const handleUpload = useCallback(async (dataUrl: string) => {
    setCapturedImage(dataUrl);
    setScanning(true);
    setPhotoNote(null);
    setAiLabel(null);

    const fallbackImg = new Image();
    fallbackImg.onload = async () => {
      const aiResult = await analyzeProduce(fallbackImg);
      setRipeness(aiResult.ripeness);
      setBruising(aiResult.bruising);
      setPhotoNote(aiResult.note);
      setAiLabel(`${aiResult.label} · ${aiResult.confidence}% confidence`);
      setScanning(false);
    };
    fallbackImg.onerror = () => {
      setRipeness(50);
      setBruising(15);
      setPhotoNote('Could not load the uploaded image. Adjust the sliders manually.');
      setScanning(false);
    };
    fallbackImg.src = dataUrl;
  }, []);

  const doScan = useCallback(async () => {
    setScanning(true);
    setResult(null);
    await new Promise((r) => setTimeout(r, 800));
    const res = analyzeCrate({ crop, ripeness, bruising });
    setResult(res);
    setScanning(false);

    // Save to Supabase
    const { data, error } = await supabase
      .from('scans')
      .insert({
        crop,
        ripeness,
        bruising,
        grade: res.grade,
        shelf_life_hours: res.shelfLifeHours,
        photo_url: capturedImage,
      })
      .select('id')
      .maybeSingle();
    if (!error && data) {
      onScanSaved(data.id);
    }

    // Save to localStorage history
    const entry: HistoryEntry = {
      id: data?.id ?? crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      crop,
      ripeness,
      bruising,
      grade: res.grade,
      shelfLifeHours: res.shelfLifeHours,
      coldLifeHours: res.coldLifeHours,
      score: res.score,
      route: res.route,
      photo: capturedImage,
      location: locationName,
      lat: coords?.lat ?? null,
      lon: coords?.lon ?? null,
    };
    addHistoryEntry(entry);
  }, [crop, ripeness, bruising, capturedImage, onScanSaved, locationName, coords]);

  const gradeColor: Record<Grade, string> = {
    A: 'text-forest-500',
    B: 'text-gold-600',
    C: 'text-alert',
  };
  const gradeBg: Record<Grade, string> = {
    A: 'bg-forest-50 border-forest-200',
    B: 'bg-gold-50 border-gold-200',
    C: 'bg-alert/10 border-alert/30',
  };

  if (view === 'guide') {
    return (
      <div>
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setView('scan')}
            className="btn-ghost px-4 py-2.5 w-auto text-sm"
          >
            ← Back to scanner
          </button>
        </div>
        <StorageGuide />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-up">
      {/* Top toolbar */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowHistory(true)}
          className="flex items-center gap-1.5 text-sm font-semibold text-mute hover:text-ink transition"
        >
          <History size={16} /> History
        </button>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setView('guide')}
            className="flex items-center gap-1.5 text-sm font-semibold text-mute hover:text-ink transition"
          >
            <BookOpen size={16} /> Guide
          </button>
          <button
            onClick={() => setShowTMModal(true)}
            className="flex items-center gap-1.5 text-sm font-semibold text-mute hover:text-ink transition"
          >
            <Settings size={16} /> AI
            {tmConnected && <span className="w-2 h-2 rounded-full bg-forest-500" />}
          </button>
        </div>
      </div>

      {aiLabel && (
        <div className="card p-3 flex items-center gap-2 border-forest-200 animate-fade-in">
          <Sparkles size={18} className="text-forest-500 shrink-0" />
          <span className="text-sm font-semibold">{aiLabel}</span>
          {!tmConnected && <span className="ml-auto chip bg-gold-50 text-gold-700 text-[10px]">Demo</span>}
        </div>
      )}

      <div className="card p-4">
        <label className="label" htmlFor="crop">Crop</label>
        <div className="grid grid-cols-3 gap-2">
          {CROPS.map((c) => (
            <button
              key={c.name}
              type="button"
              onClick={() => setCrop(c.name)}
              className={`flex flex-col items-center gap-0.5 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                crop === c.name
                  ? 'border-forest-500 bg-forest-50 text-forest-700'
                  : 'border-parchment-300 bg-parchment-50 text-mute hover:border-forest-200'
              }`}
            >
              <span className="text-xl">{c.emoji}</span>
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <div className="card p-4">
        <Camera onCapture={handleCapture} onUpload={handleUpload} />
        {photoNote && <p className="mt-2 text-sm text-mute">{photoNote}</p>}
        {locationName && (
          <p className="mt-2 text-xs text-mute flex items-center gap-1">
            <MapPin size={12} /> Location: {locationName}
          </p>
        )}
      </div>

      <div className="card p-4 space-y-4">
        <div>
          <label className="label" htmlFor="rip">
            Ripeness: <span className="text-forest-600">{ripeness}%</span>{' '}
            <span className="text-mute font-normal">(0 raw · 100 overripe)</span>
          </label>
          <input
            id="rip"
            type="range"
            min={0}
            max={100}
            value={ripeness}
            onChange={(e) => setRipeness(Number(e.target.value))}
            className="w-full accent-forest-500"
          />
        </div>
        <div>
          <label className="label" htmlFor="bru">
            Bruising: <span className="text-alert">{bruising}%</span>
          </label>
          <input
            id="bru"
            type="range"
            min={0}
            max={100}
            value={bruising}
            onChange={(e) => setBruising(Number(e.target.value))}
            className="w-full accent-alert"
          />
        </div>
        <button className="btn-primary" onClick={doScan} disabled={scanning}>
          {scanning ? 'Scanning…' : 'Scan crate'}
        </button>
        <div className="h-2 bg-parchment-300 rounded-full overflow-hidden">
          {scanning && <div className="h-full bg-forest-500 animate-pulse-ring" />}
        </div>
      </div>

      {result && (
        <div className={`card p-5 border-2 ${gradeBg[result.grade]} animate-fade-up`}>
          <div className="flex items-start justify-between">
            <div>
              <div className={`text-6xl font-extrabold leading-none ${gradeColor[result.grade]}`}>
                {result.grade}
              </div>
              <span className="text-mute text-sm">Quality grade</span>
            </div>
            <div className="text-right">
              <div className="text-3xl font-extrabold">{result.shelfLifeHours} h</div>
              <span className="text-mute text-sm">Shelf life at room temp</span>
            </div>
          </div>
          <p className="mt-3 font-semibold text-ink">{result.route}</p>
          <p className="mt-1 text-sm text-mute flex items-center gap-1.5">
            <Thermometer size={15} /> In a cold room this crate could last about {result.coldLifeHours} h.
          </p>
          {result.grade !== 'C' && (
            <button className="btn-brand mt-4" onClick={onFindColdRoom}>
              Find a cold room
            </button>
          )}
        </div>
      )}

      {showTMModal && <TeachableMachineModal onClose={() => { setShowTMModal(false); setTmConnected(hasTMModel()); }} />}
      {showHistory && <ScanHistory onClose={() => setShowHistory(false)} />}
    </div>
  );
}
