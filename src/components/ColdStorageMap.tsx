import { useEffect, useRef } from 'react';
import type { ColdHub } from '@/lib/types';

interface ColdStorageMapProps {
  hubs: ColdHub[];
  userLat: number;
  userLon: number;
  selectedHub: ColdHub | null;
  height?: string;
}

export default function ColdStorageMap({ hubs, userLat, userLon, selectedHub, height = '300px' }: ColdStorageMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Dynamically import Leaflet
    import('leaflet').then((L) => {
      if (!containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current).setView([userLat, userLon], 12);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
      }).addTo(map);

      // User location marker
      const userIcon = L.divIcon({
        html: '<div style="width:16px;height:16px;background:#2D6A4F;border:3px solid white;border-radius:50%;box-shadow:0 0 8px rgba(0,0,0,0.3);"></div>',
        className: '',
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });
      L.marker([userLat, userLon], { icon: userIcon })
        .addTo(map)
        .bindPopup('Your location');

      // Hub markers
      hubs.forEach((hub) => {
        const hubIcon = L.divIcon({
          html: `<div style="font-size:20px;">❄️</div>`,
          className: '',
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });
        const marker = L.marker([hub.lat, hub.lon], { icon: hubIcon })
          .addTo(map)
          .bindPopup(`<b>${hub.name}</b><br/>${hub.distance_km} km away<br/>₹${hub.price_per_crate_per_day}/crate/day`);
        markersRef.current.push(marker);
      });

      mapRef.current = map;
    }).catch(() => {
      // Leaflet failed to load — the container will just be empty
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      markersRef.current = [];
    };
  }, [userLat, userLon]);

  // Fly to selected hub when it changes
  useEffect(() => {
    if (!mapRef.current || !selectedHub) return;
    import('leaflet').then((L) => {
      mapRef.current.flyTo([selectedHub.lat, selectedHub.lon], 14, { duration: 0.8 });
      const marker = markersRef.current.find((m) => {
        const ll = m.getLatLng();
        return Math.abs(ll.lat - selectedHub.lat) < 0.0001 && Math.abs(ll.lng - selectedHub.lon) < 0.0001;
      });
      if (marker) marker.openPopup();
    });
  }, [selectedHub]);

  return (
    <div
      ref={containerRef}
      style={{ height }}
      className="rounded-xl overflow-hidden border border-parchment-300 z-0"
    />
  );
}
