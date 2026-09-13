'use client';

import { useEffect, useMemo, useRef } from 'react';
import type { River, RiverStatus } from '@repo/ui/types';

const STATUS_COLORS: Record<RiverStatus, string> = {
  good: '#10B981',
  warning: '#F59E0B',
  critical: '#EF4444',
};

const STATUS_LABELS: Record<RiverStatus, string> = {
  good: 'Baik',
  warning: 'Waspada',
  critical: 'Kritis',
};

export interface RiverMapProps {
  rivers: River[];
  height?: string;
  selectedSlug?: string;
  onSelectRiver?: (slug: string) => void;
  className?: string;
}

export interface LegendProps {
  className?: string;
}

/**
 * Interactive Leaflet map of Indonesia's monitored river basins.
 * Markers are coloured by water-quality status; critical basins get a pulsing halo.
 * Rendered client-side only (see ./index for the ssr:false wrapper).
 */
export default function RiverMap({
  rivers,
  height = '520px',
  selectedSlug,
  onSelectRiver,
  className,
}: RiverMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const layerRef = useRef<any>(null);

  const markers = useMemo(
    () =>
      rivers.map((r) => ({
        slug: r.slug,
        name: r.name,
        status: r.status,
        ika: r.ikaScore,
        lat: r.coordinates.lat,
        lng: r.coordinates.lng,
      })),
    [rivers]
  );

  /**
   * Identity of the marker set, independent of the array identity.
   *
   * Callers normally pass `rivers` as a fresh array literal on every render.
   * Depending on `markers` directly would then re-run the init effect each
   * time, and its cleanup removes the Leaflet instance — so selecting a basin
   * would tear down and rebuild the whole map instead of panning to it. Keying
   * on the serialised content keeps the effect stable until the data actually
   * changes.
   */
  const markerKey = useMemo(
    () => markers.map((m) => `${m.slug}:${m.status}:${m.lat}:${m.lng}:${m.ika}`).join('|'),
    [markers]
  );

  /**
   * Latest marker list, readable from effects without becoming a dependency.
   * The selection effect must see current markers without re-running whenever
   * the caller passes a new array.
   */
  const markersRef = useRef(markers);
  markersRef.current = markers;

  useEffect(() => {
    let disposed = false;

    async function init() {
      const L = (await import('leaflet')).default;

      if (disposed || !containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current, {
        center: [-2.5, 118],
        zoom: 5,
        scrollWheelZoom: false,
        attributionControl: true,
      });
      mapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '&copy; OpenStreetMap',
      }).addTo(map);

      const layer = L.layerGroup().addTo(map);
      layerRef.current = layer;

      for (const m of markers) {
        const color = STATUS_COLORS[m.status];
        const pulse =
          m.status === 'critical'
            ? `<span class="river-pin__halo" style="background:${color}"></span>`
            : '';

        const icon = L.divIcon({
          className: 'river-pin',
          iconSize: [22, 22],
          iconAnchor: [11, 11],
          popupAnchor: [0, -12],
          html: `<span class="river-pin__dot" style="background:${color}"></span>${pulse}`,
        });

        const marker = L.marker([m.lat, m.lng], {
          icon,
          title: `Sungai ${m.name}`,
        });

        marker.bindPopup(
          `<div style="font-family:inherit;min-width:150px">
             <strong style="font-size:14px">Sungai ${m.name}</strong><br/>
             <span style="color:${color};font-weight:600">${STATUS_LABELS[m.status]}</span>
             <span style="color:#64748B"> &middot; IKA ${m.ika}</span>
           </div>`
        );

        marker.on('click', () => onSelectRiver?.(m.slug));
        marker.addTo(layer);
      }
    }

    init();

    return () => {
      disposed = true;
      mapRef.current?.remove?.();
      mapRef.current = null;
      layerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markerKey]);

  /* Centre on the selected basin without tearing down the map. */
  useEffect(() => {
    if (!selectedSlug || !mapRef.current) return;
    const target = markersRef.current.find((m) => m.slug === selectedSlug);
    if (target) mapRef.current.setView([target.lat, target.lng], 8, { animate: true });
  }, [selectedSlug, markerKey]);

  return (
    <div className={className}>
      <style>{`
        .river-pin { background: transparent; border: 0; }
        .river-pin__dot {
          position: absolute; inset: 0; border-radius: 9999px;
          border: 2px solid #fff; box-shadow: 0 1px 4px rgba(0,0,0,.4);
        }
        .river-pin__halo {
          position: absolute; inset: 0; border-radius: 9999px;
          opacity: .55; animation: river-pulse 2s cubic-bezier(.16,1,.3,1) infinite;
        }
        @keyframes river-pulse {
          0%   { transform: scale(.85); opacity: .6; }
          80%,100% { transform: scale(2.2); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .river-pin__halo { animation: none; opacity: .35; }
        }
        .leaflet-container { font-family: inherit; }
      `}</style>
      <div
        ref={containerRef}
        style={{ height, width: '100%' }}
        className="overflow-hidden rounded-2xl border border-[var(--border-editorial)]"
        role="application"
        aria-label="Peta interaktif tujuh daerah aliran sungai yang dipantau Jagatirta"
      />
    </div>
  );
}
