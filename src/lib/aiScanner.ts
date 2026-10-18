import type { AIScanResult } from './types';

const TM_MODEL_KEY = 'freshgrid_tm_model_url';

export function getTMModelUrl(): string | null {
  return localStorage.getItem(TM_MODEL_KEY);
}

export function setTMModelUrl(url: string): void {
  localStorage.setItem(TM_MODEL_KEY, url);
}

export function clearTMModelUrl(): void {
  localStorage.removeItem(TM_MODEL_KEY);
}

export function hasTMModel(): boolean {
  const url = getTMModelUrl();
  return !!url && url.startsWith('http');
}

/**
 * Load a Teachable Machine model dynamically.
 * TM models use a script-based init — we load the TM library on demand.
 * Returns a predictor function that takes an image element and returns predictions.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let tmModel: any = null;
let tmModelUrl: string | null = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function loadTMModel(url: string): Promise<any> {
  // Teachable Machine models are hosted as a JS file that sets up window.tmImage
  if (!(window as unknown as { tmImage?: unknown }).tmImage) {
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@1.3.1/dist/tf.min.js';
      script.onload = () => {
        const script2 = document.createElement('script');
        script2.src = 'https://cdn.jsdelivr.net/npm/@teachablemachine/image@0.8.3/dist/teachablemachine-image.min.js';
        script2.onload = () => resolve();
        script2.onerror = () => reject(new Error('Could not load Teachable Machine library'));
        document.head.appendChild(script2);
      };
      script.onerror = () => reject(new Error('Could not load TensorFlow.js'));
      document.head.appendChild(script);
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tmImage = (window as unknown as { tmImage: any }).tmImage;
  const model = await tmImage.load(url + 'model.json', url + 'metadata.json');
  return { model, tmImage };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function predictWithTM(img: HTMLImageElement | HTMLCanvasElement, model: any, tmImage: any): Promise<AIScanResult> {
  const predictions = await model.predict(img);
  // predictions is an array of { className, probability }
  predictions.sort((a: { probability: number }, b: { probability: number }) => b.probability - a.probability);
  const top = predictions[0];
  const label = top.className as string;
  const confidence = Math.round(top.probability * 100);

  // Derive ripeness and bruising from label heuristics
  const lower = label.toLowerCase();
  let ripeness = 50;
  let bruising = 15;

  if (lower.includes('ripe') || lower.includes('fresh') || lower.includes('grade') && lower.includes('a')) {
    ripeness = 55;
    bruising = 5;
  } else if (lower.includes('over') || lower.includes('spoil') || lower.includes('rot') || lower.includes('grade') && lower.includes('c')) {
    ripeness = 85;
    bruising = 45;
  } else if (lower.includes('raw') || lower.includes('green') || lower.includes('unripe')) {
    ripeness = 20;
    bruising = 10;
  } else if (lower.includes('grade') && lower.includes('b')) {
    ripeness = 50;
    bruising = 20;
  }

  return {
    label,
    confidence,
    ripeness,
    bruising,
    note: `Teachable Machine identified "${label}" with ${confidence}% confidence. Adjust sliders if needed.`,
  };
}

/**
 * Demo-mode analysis — simulates vegetable detection using color analysis.
 * This is the fallback when no TM model is connected.
 */
async function demoAnalyze(img: HTMLImageElement | HTMLCanvasElement): Promise<AIScanResult> {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    return {
      label: 'Unknown',
      confidence: 0,
      ripeness: 50,
      bruising: 15,
      note: 'Could not analyze image. Set the sliders manually.',
    };
  }

  // Center-crop to square
  const srcW = img instanceof HTMLImageElement ? img.naturalWidth : (img as HTMLCanvasElement).width;
  const srcH = img instanceof HTMLImageElement ? img.naturalHeight : (img as HTMLCanvasElement).height;
  const side = Math.min(srcW, srcH);
  const sx = (srcW - side) / 2;
  const sy = (srcH - side) / 2;
  ctx.drawImage(img, sx, sy, side, side, 0, 0, 128, 128);
  const data = ctx.getImageData(0, 0, 128, 128).data;

  let ripe = 0, green = 0, dark = 0, n = 0;
  let totalR = 0, totalG = 0, totalB = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] / 255;
    const g = data[i + 1] / 255;
    const b = data[i + 2] / 255;
    totalR += r; totalG += g; totalB += b;
    const mx = Math.max(r, g, b);
    const mn = Math.min(r, g, b);
    const k = mx - mn;
    const s = mx ? k / mx : 0;
    let h = 0;
    if (k) {
      h = mx === r ? ((g - b) / k) % 6 : mx === g ? (b - r) / k + 2 : (r - g) / k + 4;
      h *= 60;
      if (h < 0) h += 360;
    }
    if (s < 0.15 && mx > 0.6) continue;
    n++;
    if (mx < 0.3 || (h >= 10 && h <= 45 && s > 0.35 && mx < 0.5)) dark++;
    else if (s > 0.25) {
      if (h <= 65 || h >= 340) ripe++;
      else if (h >= 70 && h <= 170) green++;
    }
  }

  if (n < 300) {
    return {
      label: 'No produce detected',
      confidence: 30,
      ripeness: 50,
      bruising: 15,
      note: 'Could not clearly identify produce. Take a closer, well-lit photo or adjust sliders manually.',
    };
  }

  const ripeness = ripe + green > 0 ? Math.round((ripe / (ripe + green)) * 100) : 50;
  const bruising = Math.min(100, Math.round((dark / n) * 150));

  // Guess a label based on dominant hue
  const avgR = totalR / n;
  const avgG = totalG / n;
  const avgB = totalB / n;
  let label = 'Vegetable';
  const domColor = avgR > avgG && avgR > avgB ? 'red' : avgG > avgR && avgG > avgB ? 'green' : 'other';
  if (domColor === 'red') label = ripeness > 60 ? 'Ripe Tomato' : 'Semi-ripe Tomato';
  else if (domColor === 'green') label = green > ripe * 2 ? 'Leafy Green' : 'Unripe Produce';
  else if (avgR > 0.5 && avgG > 0.4) label = 'Mango/Papaya';

  const confidence = Math.min(95, 50 + Math.round((n / 1000) * 30));

  return {
    label,
    confidence,
    ripeness,
    bruising,
    note: `Demo analysis: detected "${label}" (ripeness ${ripeness}%, bruising ${bruising}%). Connect a Teachable Machine model for AI-powered classification.`,
  };
}

/**
 * Main entry point — analyzes a captured/uploaded image.
 * Uses Teachable Machine if a model URL is configured, otherwise falls back to demo mode.
 */
export async function analyzeProduce(img: HTMLImageElement | HTMLCanvasElement): Promise<AIScanResult> {
  const url = getTMModelUrl();
  if (url && url.startsWith('http')) {
    try {
      if (!tmModel || tmModelUrl !== url) {
        tmModel = await loadTMModel(url);
        tmModelUrl = url;
      }
      return await predictWithTM(img, tmModel.model, tmModel.tmImage);
    } catch (e) {
      // Fall back to demo if TM fails
      const result = await demoAnalyze(img);
      return {
        ...result,
        note: `Teachable Machine model failed to load (${String((e as Error).message)}). Using demo mode. ${result.note}`,
      };
    }
  }
  return demoAnalyze(img);
}
