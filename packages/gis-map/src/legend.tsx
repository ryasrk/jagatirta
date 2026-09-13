import type { RiverStatus } from '@repo/ui/types';

const ITEMS: { status: RiverStatus; label: string; hint: string; color: string }[] = [
  { status: 'good', label: 'Baik', hint: 'Mutu air memenuhi baku mutu', color: '#10B981' },
  { status: 'warning', label: 'Waspada', hint: 'Tercemar ringan, perlu pengawasan', color: '#F59E0B' },
  { status: 'critical', label: 'Kritis', hint: 'Tercemar berat, butuh tindakan segera', color: '#EF4444' },
];

export interface MapLegendProps {
  className?: string;
}

/** Colour legend for the river-status markers. */
export function MapLegend({ className }: MapLegendProps) {
  return (
    <ul
      className={['flex flex-wrap items-center gap-x-5 gap-y-2 text-sm', className]
        .filter(Boolean)
        .join(' ')}
    >
      {ITEMS.map((item) => (
        <li key={item.status} className="flex items-center gap-2" title={item.hint}>
          <span
            aria-hidden="true"
            className="h-3 w-3 shrink-0 rounded-full border-2 border-white shadow"
            style={{ background: item.color }}
          />
          <span className="text-ink-secondary">{item.label}</span>
        </li>
      ))}
    </ul>
  );
}

export default MapLegend;
