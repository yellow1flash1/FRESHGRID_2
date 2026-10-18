import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera as CameraIcon, CameraOff, RefreshCw, Repeat, Upload, AlertTriangle, X } from 'lucide-react';
import type { FacingMode } from '@/lib/types';

interface CameraProps {
  onCapture: (dataUrl: string) => void;
  onUpload: (dataUrl: string) => void;
}

export default function Camera({ onCapture, onUpload }: CameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [facingMode, setFacingMode] = useState<FacingMode>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
  }, []);

  const startCamera = useCallback(async (mode: FacingMode) => {
    setCameraError(null);
    setSnapshot(null);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraOn(true);
    } catch (e) {
      const err = e as Error;
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera permission denied. Allow camera access in your browser settings, or use the Upload button below.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('No camera found on this device. Use the Upload button to select a photo from your device.');
      } else if (err.name === 'NotReadableError') {
        setCameraError('Camera is being used by another app. Close it and try again, or use the Upload button.');
      } else if (window.location !== window.parent.location) {
        setCameraError('Camera may be blocked inside an embedded frame. Use the Upload button to select a photo, or open FreshGrid in a new tab.');
      } else {
        setCameraError('Could not access the camera. Check browser permissions, then try again — or use the Upload button.');
      }
      setCameraOn(false);
    }
  }, []);

  const switchCamera = useCallback(() => {
    const newMode: FacingMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newMode);
    if (cameraOn) {
      startCamera(newMode);
    }
  }, [facingMode, cameraOn, startCamera]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const capture = useCallback(() => {
    if (!videoRef.current || !streamRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const vw = video.videoWidth || 480;
    const vh = video.videoHeight || 360;
    const side = Math.min(vw, vh);
    canvas.width = side;
    canvas.height = side;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    // Center-crop to square
    const sx = (vw - side) / 2;
    const sy = (vh - side) / 2;
    ctx.drawImage(video, sx, sy, side, side, 0, 0, side, side);
    const url = canvas.toDataURL('image/jpeg', 0.85);
    setSnapshot(url);
    setCapturing(true);
    onCapture(url);
  }, [onCapture]);

  const handleUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setCameraError('Please select an image file (JPG, PNG, etc.).');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setSnapshot(dataUrl);
      setCameraError(null);
      onUpload(dataUrl);
    };
    reader.onerror = () => {
      setCameraError('Could not read the selected file. Try a different image.');
    };
    reader.readAsDataURL(file);
  }, [onUpload]);

  const clearSnapshot = useCallback(() => {
    setSnapshot(null);
    setCameraError(null);
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="label mb-0">Live camera</span>
        <div className="flex items-center gap-2">
          {cameraOn && (
            <button
              type="button"
              onClick={switchCamera}
              className="flex items-center gap-1 text-sm font-semibold text-gold-600 hover:underline"
            >
              <Repeat size={16} /> Flip
            </button>
          )}
          {cameraOn ? (
            <button
              type="button"
              onClick={stopCamera}
              className="flex items-center gap-1.5 text-sm font-semibold text-alert hover:underline"
            >
              <CameraOff size={16} /> Stop
            </button>
          ) : (
            <button
              type="button"
              onClick={() => startCamera(facingMode)}
              className="flex items-center gap-1.5 text-sm font-semibold text-forest-600 hover:underline"
            >
              <CameraIcon size={16} /> Start
            </button>
          )}
        </div>
      </div>

      {cameraError && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-alert/10 text-alert text-sm mb-3">
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          <span>{cameraError}</span>
        </div>
      )}

      <div className="relative rounded-xl overflow-hidden bg-forest-900 aspect-square">
        <video
          ref={videoRef}
          playsInline
          muted
          className={`w-full h-full object-cover ${cameraOn ? 'block' : 'hidden'}`}
        />
        {!cameraOn && !snapshot && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-forest-100 gap-2">
            <CameraIcon size={40} className="opacity-60" />
            <p className="text-sm opacity-80 text-center px-4">Tap "Start" to scan your crate live</p>
          </div>
        )}
        {cameraOn && (
          <>
            {/* Viewfinder frame */}
            <div className="absolute inset-4 pointer-events-none">
              <div className="absolute top-0 left-0 w-8 h-8 border-l-4 border-t-4 border-white/80 rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-8 h-8 border-r-4 border-t-4 border-white/80 rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-l-4 border-b-4 border-white/80 rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-r-4 border-b-4 border-white/80 rounded-br-lg" />
              <div className="absolute inset-0 border-2 border-white/30 rounded-lg" />
              {/* Center crosshair */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 border-2 border-white/40 rounded-full" />
            </div>
            <p className="absolute top-3 left-1/2 -translate-x-1/2 text-xs text-white/90 bg-black/40 px-3 py-1 rounded-full pointer-events-none">
              Center the vegetable in the frame
            </p>
            <button
              type="button"
              onClick={capture}
              disabled={capturing}
              className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-ink font-bold shadow-pop active:scale-95 transition disabled:opacity-60"
            >
              {capturing ? <RefreshCw size={18} className="animate-spin-slow" /> : <CameraIcon size={18} />}
              {capturing ? 'Analyzing…' : 'Capture photo'}
            </button>
          </>
        )}
        {snapshot && !cameraOn && (
          <img src={snapshot} alt="Captured produce" className="w-full h-full object-cover" />
        )}
        {snapshot && (
          <button
            type="button"
            onClick={clearSnapshot}
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Upload fallback */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleUpload}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-mute hover:text-ink"
      >
        <Upload size={15} /> Upload photo from device
      </button>
    </div>
  );
}
