'use client';

import dynamic from 'next/dynamic';
import type { RiverMapProps } from './river-map';

export type { RiverMapProps } from './river-map';
export { MapLegend } from './legend';
export type { MapLegendProps } from './legend';
export { default as RiverMapImpl } from './river-map';

function MapSkeleton({ height = '520px' }: { height?: string }) {
  return (
    <div
      style={{ height }}
      className="flex w-full animate-pulse items-center justify-center rounded-2xl border border-[var(--border-editorial)] bg-canvas"
      aria-hidden="true"
    >
      <span className="text-sm text-ink-secondary">Memuat peta…</span>
    </div>
  );
}

/**
 * Public RiverMap export.
 * Leaflet touches `window`, so it is loaded client-side only.
 */
export const RiverMap = dynamic<RiverMapProps>(
  () => import('./river-map').then((m) => m.default),
  {
    ssr: false,
    loading: () => <MapSkeleton />,
  }
);
