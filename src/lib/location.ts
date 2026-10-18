export interface GeoLocation {
  lat: number;
  lon: number;
  accuracy?: number;
}

export interface ReverseGeocodeResult {
  displayName: string;
  city: string | null;
  state: string | null;
  village: string | null;
}

export function getCurrentPosition(): Promise<GeoLocation> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported on this device.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      (err) => {
        let msg = 'Location access denied.';
        if (err.code === err.PERMISSION_DENIED) {
          msg = 'Location permission denied. Search by place name instead.';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          msg = 'Location unavailable. Check your GPS or search by place name.';
        } else if (err.code === err.TIMEOUT) {
          msg = 'Location request timed out. Try again or search by place name.';
        }
        reject(new Error(msg));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  });
}

export async function reverseGeocode(lat: number, lon: number): Promise<ReverseGeocodeResult> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14&addressdetails=1`;
    const res = await fetch(url);
    if (!res.ok) return { displayName: 'Unknown location', city: null, state: null, village: null };
    const data = (await res.json()) as {
      display_name: string;
      address?: {
        city?: string;
        town?: string;
        village?: string;
        state?: string;
        county?: string;
        municipality?: string;
      };
    };
    const city = data.address?.city ?? data.address?.town ?? data.address?.municipality ?? null;
    const village = data.address?.village ?? null;
    const state = data.address?.state ?? null;
    const shortName = city ?? village ?? data.address?.county ?? 'Unknown location';
    return {
      displayName: data.display_name ?? shortName,
      city,
      state,
      village,
    };
  } catch {
    return { displayName: 'Unknown location', city: null, state: null, village: null };
  }
}

export async function geocodePlace(q: string): Promise<GeoLocation | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const arr = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (!arr.length) return null;
    return { lat: Number(arr[0].lat), lon: Number(arr[0].lon) };
  } catch {
    return null;
  }
}

export function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function googleMapsNavUrl(userLat: number, userLon: number, destLat: number, destLon: number): string {
  return `https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLon}&destination=${destLat},${destLon}&travelmode=driving`;
}

export function googleMapsSearchUrl(lat: number, lon: number): string {
  return `https://www.google.com/maps/search/?api=1&query=Cold+Storage+near+${lat},${lon}`;
}

export function googleMapsViewUrl(lat: number, lon: number): string {
  return `https://www.google.com/maps/@${lat},${lon},15z`;
}
