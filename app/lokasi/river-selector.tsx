'use client';

import { Card, CardBody, STATUS_LABELS, StatusPill, cn } from '@repo/ui';
import type { River } from '@repo/ui/types';

const IKA_FORMAT = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 });

const DATE_FORMAT = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

/** Format tanggal yang aman terhadap data cacat dari pos pantau. */
function formatDate(isoDate: string): string {
  const timestamp = Date.parse(isoDate);
  return Number.isNaN(timestamp) ? isoDate : DATE_FORMAT.format(timestamp);
}

export interface RiverSelectorProps {
  rivers: River[];
  selectedSlug: string;
  onSelect: (slug: string) => void;
}

/**
 * Daftar cepat seluruh pos pantau di bawah peta.
 *
 * Dirender sebagai grup tombol bertipe radio (roving `aria-checked`) supaya
 * pemilihan tetap satu nilai dan pembaca layar mengumumkan "3 dari 7" — bukan
 * sebagai tautan palsu yang tidak mengubah URL.
 */
export function RiverSelector({ rivers, selectedSlug, onSelect }: RiverSelectorProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Pilih sungai yang dipantau"
      className="mt-6 grid grid-cols-1 gap-grid-tight sm:grid-cols-2 xl:grid-cols-3"
    >
      {rivers.map((river) => {
        const isSelected = river.slug === selectedSlug;

        return (
          <Card
            key={river.slug}
            className={cn(
              'transition-[transform,box-shadow,border-color] duration-200 ease-crisp',
              isSelected
                ? '-translate-y-0.5 border-brand-primary shadow-lg'
                : 'hover:-translate-y-0.5 hover:border-brand-primary hover:shadow-md',
            )}
          >
            <button
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onSelect(river.slug)}
              className={cn(
                'flex min-h-[48px] w-full flex-col gap-3 px-5 py-5 text-left',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent',
                'focus-visible:ring-inset',
              )}
            >
              <span className="flex w-full items-start justify-between gap-3">
                <span className="min-w-0">
                  <span className="block font-display text-lg font-semibold leading-snug tracking-tight text-ink">
                    Sungai {river.name}
                  </span>
                  <span className="mt-1 block truncate text-xs text-ink-secondary">
                    {river.province}
                  </span>
                </span>

                <span className="flex shrink-0 flex-col items-end gap-1">
                  <span className="font-mono text-2xl font-bold leading-none tabular-nums text-brand-deep">
                    {IKA_FORMAT.format(river.ikaScore)}
                  </span>
                  <span className="font-mono text-xs uppercase tracking-[0.12em] text-ink-secondary">
                    IKA
                  </span>
                </span>
              </span>

              <span className="flex flex-wrap items-center gap-2">
                <StatusPill status={river.status} label={STATUS_LABELS[river.status]} />
                <span className="font-mono text-xs text-ink-secondary">
                  {formatDate(river.lastUpdated)}
                </span>
              </span>
            </button>

            {/*
              Sebelumnya daftar isu dipaksa satu baris dengan `line-clamp-1`,
              sehingga Cisadane (56 karakter) terpotong di tengah kata
              sementara Citarum (42 karakter) tampil utuh — padahal keduanya
              sama-sama memuat tiga isu. Dijadikan label terpisah agar setiap
              isu terbaca penuh dan tepi bawah kartu tetap rata.
            */}
            <CardBody className="border-t border-editorial px-5 py-3">
              <ul className="flex flex-wrap gap-1.5">
                {river.issues.map((issue) => (
                  <li
                    key={issue}
                    className="rounded-full bg-brand-soft/50 px-2.5 py-1 text-xs font-medium leading-none text-brand-deep"
                  >
                    {issue}
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
}

export default RiverSelector;
