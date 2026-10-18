import { useCallback, useEffect, useState } from 'react';
import { MapPin, Search, Snowflake, Loader2, Navigation, Tag, CreditCard, ExternalLink, Map as MapIcon, X } from 'lucide-react';
import { EDGE_URL, ANON_KEY, supabase } from '@/lib/supabase';
import type { ColdHub } from '@/lib/types';
import {
  getCurrentPosition,
  reverseGeocode,
  googleMapsNavUrl,
  googleMapsSearchUrl,
} from '@/lib/location';
import ColdStorageMap from '@/components/ColdStorageMap';

interface HubPanelProps {
  pendingScanId: string | null;
}

const RADII = [
  { label: '10 km', value: 10000 },
  { label: '25 km', value: 25000 },
  { label: '50 km', value: 50000 },
];

export default function HubPanel({ pendingScanId }: HubPanelProps) {
  const [query, setQuery] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [locationName, setLocationName] = useState<string | null>(null);
  const [hubs, setHubs] = useState<ColdHub[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<string>('');
  const [selected, setSelected] = useState<ColdHub | null>(null);
  const [crates, setCrates] = useState(1);
  const [days, setDays] = useState(2);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [paid, setPaid] = useState(false);
  const [radius, setRadius] = useState(25000);
  const [showMap, setShowMap] = useState(false);
  const [mapHub, setMapHub] = useState<ColdHub | null>(null);

  const search = useCallback(async (lat: number, lon: number, r: number) => {
    setLoading(true);
    setError(null);
    setSelected(null);
    setPaid(false);
    setBookingId(null);
    try {
      const res = await fetch(`${EDGE_URL}/cold-rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ANON_KEY}` },
        body: JSON.stringify({ lat, lon, radius: r }),
      });
      if (!res.ok) throw new Error(`Search failed (${res.status})`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setHubs(data.hubs ?? []);
      setSource(data.source ?? '');
    } catch (e) {
      setError(String((e as Error).message));
      setHubs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const useMyLocation = useCallback(() => {
    setLoading(true);
    setError(null);
    getCurrentPosition()
      .then(async (pos) => {
        const { lat, lon } = pos;
        setCoords({ lat, lon });
        setQuery('');
        const rg = await reverseGeocode(lat, lon);
        const shortName = rg.city ?? rg.village ?? null;
        if (shortName) setLocationName(shortName);
        search(lat, lon, radius);
      })
      .catch((e) => {
        setError(String((e as Error).message));
        setLoading(false);
      });
  }, [search, radius]);

  const searchByQuery = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${EDGE_URL}/cold-rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ANON_KEY}` },
        body: JSON.stringify({ q: query.trim(), radius }),
      });
      if (!res.ok) throw new Error(`Search failed (${res.status})`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setHubs(data.hubs ?? []);
      setSource(data.source ?? '');
      if (data.center) setCoords(data.center);
    } catch (e) {
      setError(String((e as Error).message));
      setHubs([]);
    } finally {
      setLoading(false);
    }
  }, [query, radius]);

  useEffect(() => {
    useMyLocation();
  }, [useMyLocation]);

  const total = selected ? Math.round(crates * days * selected.price_per_crate_per_day) : 0;

  const book = useCallback(async () => {
    if (!selected) return;
    setPaying(false);
    setPayError(null);
    setPaid(false);
    const { data, error: insErr } = await supabase
      .from('bookings')
      .insert({
        scan_id: pendingScanId,
        hub_name: selected.name,
        hub_lat: selected.lat,
        hub_lon: selected.lon,
        hub_distance_km: selected.distance_km,
        crates,
        days,
        price_per_crate_per_day: selected.price_per_crate_per_day,
        total,
        status: 'pending',
      })
      .select('id')
      .maybeSingle();
    if (insErr || !data) {
      setPayError('Could not save the booking. Try again.');
      return;
    }
    setBookingId(data.id);
  }, [selected, crates, days, total, pendingScanId]);

  const pay = useCallback(async () => {
    if (!selected) return;
    setPaying(true);
    setPayError(null);
    try {
      let bId = bookingId;
      if (!bId) {
        const { data } = await supabase
          .from('bookings')
          .insert({
            scan_id: pendingScanId,
            hub_name: selected.name,
            hub_lat: selected.lat,
            hub_lon: selected.lon,
            hub_distance_km: selected.distance_km,
            crates,
            days,
            price_per_crate_per_day: selected.price_per_crate_per_day,
            total,
            status: 'pending',
          })
          .select('id')
          .maybeSingle();
        bId = data?.id ?? null;
        setBookingId(bId);
      }
      const res = await fetch(`${EDGE_URL}/stripe-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ANON_KEY}` },
        body: JSON.stringify({
          amount_paise: total * 100,
          booking_id: bId,
          hub_name: selected.name,
          crates,
          days,
        }),
      });
      const payload = await res.json();
      if (!res.ok || payload.error) {
        throw new Error(payload.error || `Payment setup failed (${res.status})`);
      }
      if (payload.url) {
        window.location.href = payload.url;
      }
    } catch (e) {
      setPayError(String((e as Error).message));
    } finally {
      setPaying(false);
    }
  }, [selected, crates, days, total, bookingId, pendingScanId]);

  const handleRadiusChange = (r: number) => {
    setRadius(r);
    if (coords) search(coords.lat, coords.lon, r);
  };

  const openGoogleMapsNav = (hub: ColdHub) => {
    if (!coords) return;
    window.open(googleMapsNavUrl(coords.lat, coords.lon, hub.lat, hub.lon), '_blank', 'noopener,noreferrer');
  };

  const openGoogleMapsSearch = () => {
    if (!coords) return;
    window.open(googleMapsSearchUrl(coords.lat, coords.lon), '_blank', 'noopener,noreferrer');
  };

  const viewOnMap = (hub: ColdHub) => {
    setMapHub(hub);
    setShowMap(true);
  };

  return (
    <div className="space-y-4 animate-fade-up">
      <div className="card p-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-mute" />
            <input
              className="input pl-10"
              placeholder="Village, town or pin code"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchByQuery()}
            />
          </div>
          <button className="btn-ghost px-4 py-2.5 w-auto" onClick={searchByQuery} disabled={loading}>
            Search
          </button>
        </div>
        <button
          onClick={useMyLocation}
          className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-forest-600 hover:underline"
        >
          <Navigation size={15} /> Use my location
        </button>
        {locationName && (
          <p className="mt-1 text-xs text-mute flex items-center gap-1">
            <MapPin size={12} /> {locationName}
            {coords && <span className="text-mute/60">· {coords.lat.toFixed(3)}, {coords.lon.toFixed(3)}</span>}
          </p>
        )}

        {/* Radius selector */}
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs font-semibold text-mute">Search radius:</span>
          {RADII.map((r) => (
            <button
              key={r.value}
              onClick={() => handleRadiusChange(r.value)}
              className={`px-3 py-1 rounded-full text-xs font-bold border transition ${
                radius === r.value
                  ? 'border-forest-500 bg-forest-50 text-forest-700'
                  : 'border-parchment-300 text-mute hover:border-forest-200'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {error && <p className="mt-2 text-sm text-alert">{error}</p>}
        {source && !loading && (
          <p className="mt-1 text-xs text-mute">
            {source === 'openstreetmap'
              ? 'Results from OpenStreetMap live data.'
              : 'Showing nearby cold rooms from the FreshGrid network.'}
          </p>
        )}
      </div>

      {/* Google Maps search all button */}
      {coords && !loading && (
        <button
          onClick={openGoogleMapsSearch}
          className="btn-gold flex items-center justify-center gap-2"
        >
          <ExternalLink size={18} /> Find all nearby cold storages on Google Maps
        </button>
      )}

      {loading && (
        <div className="card p-8 flex flex-col items-center gap-2 text-mute">
          <Loader2 size={28} className="animate-spin-slow text-forest-500" />
          <p className="text-sm">Searching for cold rooms…</p>
        </div>
      )}

      {!loading && hubs.length === 0 && !error && (
        <div className="card p-6 text-center text-mute text-sm">
          No cold rooms found nearby. Try a larger radius or another place name.
        </div>
      )}

      <div className="space-y-3">
        {hubs.map((h) => (
          <div
            key={h.id}
            className={`card w-full p-4 transition-all hover:shadow-pop cursor-pointer ${
              selected?.id === h.id ? 'ring-2 ring-forest-500 border-forest-500' : ''
            }`}
            onClick={() => { setSelected(h); setPaid(false); setBookingId(null); book(); }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Snowflake size={18} className="text-forest-500 shrink-0" />
                  <h3 className="font-bold truncate">{h.name}</h3>
                </div>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-mute">
                  <MapPin size={14} /> {h.distance_km} km away
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {h.tags.slice(0, 3).map((t) => (
                    <span key={t} className="chip bg-forest-50 text-forest-700">
                      <Tag size={11} /> {t}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-lg font-extrabold">₹{h.price_per_crate_per_day}</div>
                <span className="text-xs text-mute">/crate/day</span>
                <div className="mt-1 text-xs font-semibold text-forest-600">{h.slots_free} slots free</div>
              </div>
            </div>

            {/* Google Maps action buttons */}
            <div className="mt-3 flex gap-2" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => openGoogleMapsNav(h)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-forest-50 text-forest-700 text-xs font-bold hover:bg-forest-100 transition"
              >
                <Navigation size={13} /> Navigate
              </button>
              <button
                onClick={() => viewOnMap(h)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-parchment-200 text-ink text-xs font-bold hover:bg-parchment-300 transition"
              >
                <MapIcon size={13} /> View on map
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Embedded map modal */}
      {showMap && coords && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 animate-fade-in" onClick={() => setShowMap(false)}>
          <div className="card w-full max-w-md rounded-t-3xl sm:rounded-2xl p-4 animate-slide-up sm:animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold">{mapHub?.name ?? 'Cold Storage Map'}</h3>
              <button onClick={() => setShowMap(false)} className="w-8 h-8 rounded-full hover:bg-parchment-200 flex items-center justify-center">
                <X size={18} />
              </button>
            </div>
            {mapHub && (
              <p className="text-sm text-mute mb-3 flex items-center gap-1.5">
                <MapPin size={14} /> {mapHub.distance_km} km · ₹{mapHub.price_per_crate_per_day}/crate/day
              </p>
            )}
            <ColdStorageMap
              hubs={hubs}
              userLat={coords.lat}
              userLon={coords.lon}
              selectedHub={mapHub}
              height="320px"
            />
            {mapHub && (
              <button
                onClick={() => openGoogleMapsNav(mapHub)}
                className="btn-brand mt-3 flex items-center justify-center gap-2"
              >
                <Navigation size={16} /> Open in Google Maps
              </button>
            )}
          </div>
        </div>
      )}

      {selected && (
        <div className="card p-5 border-2 border-forest-500 animate-fade-up">
          <h3 className="font-bold text-lg">{selected.name}</h3>
          <p className="text-sm text-mute flex items-center gap-1.5 mt-0.5">
            <MapPin size={14} /> {selected.distance_km} km · ₹{selected.price_per_crate_per_day}/crate/day
          </p>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <div>
              <label className="label" htmlFor="crates">Crates</label>
              <input
                id="crates"
                type="number"
                min={1}
                max={200}
                value={crates}
                onChange={(e) => { setCrates(Math.max(1, Number(e.target.value))); setPaid(false); }}
                className="input"
              />
            </div>
            <div>
              <label className="label" htmlFor="days">Days</label>
              <input
                id="days"
                type="number"
                min={1}
                max={14}
                value={days}
                onChange={(e) => { setDays(Math.max(1, Number(e.target.value))); setPaid(false); }}
                className="input"
              />
            </div>
          </div>

          {crates > selected.slots_free && (
            <p className="mt-3 text-sm text-alert">
              Only {selected.slots_free} slots free here. Lower the crate count or pick another hub.
            </p>
          )}

          <div className="mt-4 flex items-end justify-between">
            <span className="text-sm text-mute">Total</span>
            <span className="text-3xl font-extrabold text-forest-600">
              ₹{total.toLocaleString('en-IN')}
            </span>
          </div>

          {payError && (
            <div className="mt-3 p-3 rounded-lg bg-alert/10 text-alert text-sm">{payError}</div>
          )}

          {paid ? (
            <div className="mt-4 p-3 rounded-lg bg-forest-50 text-forest-700 font-semibold text-center">
              Payment confirmed — your slot is reserved.
            </div>
          ) : (
            <button
              className="btn-brand mt-4 flex items-center justify-center gap-2"
              onClick={pay}
              disabled={paying || crates > selected.slots_free}
            >
              {paying ? (
                <><Loader2 size={18} className="animate-spin-slow" /> Setting up payment…</>
              ) : (
                <><CreditCard size={18} /> Pay ₹{total.toLocaleString('en-IN')} by card</>
              )}
            </button>
          )}
          <p className="mt-2 text-xs text-mute">
            Pay per crate, no monthly commitment. Cancel anytime before pickup.
          </p>
        </div>
      )}
    </div>
  );
}
