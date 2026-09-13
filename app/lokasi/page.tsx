'use client';

import { useCallback, useMemo, useState } from 'react';

import { Badge, Button, Card, CardBody, cn } from '@repo/ui';
import { rivers } from '@repo/data';
import type { River } from '@repo/ui/types';
import { MapLegend, RiverMap } from '@repo/gis-map';

import { RiverDetailPanel } from './river-detail-panel';
import { RiverSelector } from './river-selector';

/**
 * Tinggi peta dipatok eksplisit agar pemuatan Leaflet tidak menggeser tata
 * letak (CLS = 0): 420px di ponsel, lebih lapang di desktop.
 *
 * Satu instance peta dipakai untuk kedua breakpoint, dan tinggi yang sama
 * diteruskan sebagai prop `height` agar skeleton pemuat (`ssr: false`) maupun
 * container Leaflet memakai ukuran identik — tanpa lompatan tata letak.
 */
const MAP_HEIGHT_CLASS = 'h-[420px] lg:h-[620px]';
const MAP_HEIGHT_ATTR = '420px';

/** Format tanggal panjang Indonesia: "10 September 2026". */
const dateFormatter = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

/** Format waktu relatif ringkas, tanpa dependensi eksternal. */
const relativeFormatter = new Intl.RelativeTimeFormat('id-ID', { numeric: 'auto' });

/**
 * Ubah tanggal ISO menjadi keterangan relatif yang ramah dibaca.
 * Nilai yang tidak terparse dikembalikan sebagai teks apa adanya agar tabel
 * tetap terbaca walau data dari pos pantau cacat.
 */
function formatRelative(isoDate: string): string {
  const timestamp = Date.parse(isoDate);
  if (Number.isNaN(timestamp)) return isoDate;

  const days = Math.round((timestamp - Date.now()) / 86_400_000);
  const absDays = Math.abs(days);
  if (absDays < 1) return relativeFormatter.format(0, 'day');
  if (absDays < 30) return relativeFormatter.format(days, 'day');

  const months = Math.round(days / 30);
  if (Math.abs(months) < 12) return relativeFormatter.format(months, 'month');
  return relativeFormatter.format(Math.round(days / 365), 'year');
}

/** Tanggal kalender panjang; dipakai di panel detail dan daftar sungai. */
function formatDate(isoDate: string): string {
  const timestamp = Date.parse(isoDate);
  return Number.isNaN(timestamp) ? isoDate : dateFormatter.format(timestamp);
}

const STATUS_ORDER: Record<River['status'], number> = {
  critical: 0,
  warning: 1,
  good: 2,
};

export default function LokasiPage() {
  /**
   * Seleksi hidup di satu tempat. Default: sungai pertama pada dataset, sehingga
   * panel detail tidak pernah kosong saat halaman baru dibuka.
   */
  const [selectedSlug, setSelectedSlug] = useState<string>(() => rivers[0]?.slug ?? '');

  const selectedRiver = useMemo(
    () => rivers.find((river) => river.slug === selectedSlug) ?? rivers[0],
    [selectedSlug],
  );

  /**
   * Ringkasan untuk strip metrik: sungai kritis dan waspada dihitung langsung
   * dari telemetri, bukan angka yang ditulis tangan di JSX.
   */
  const summary = useMemo(() => {
    let critical = 0;
    let warning = 0;
    for (const river of rivers) {
      if (river.status === 'critical') critical += 1;
      else if (river.status === 'warning') warning += 1;
    }
    return { total: rivers.length, critical, warning };
  }, []);

  /** Terburuk lebih dulu — pembaca langsung melihat sungai yang butuh tindakan. */
  const rankedRivers = useMemo(
    () =>
      [...rivers].sort(
        (a, b) =>
          STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || b.ikaScore - a.ikaScore,
      ),
    [],
  );

  const handleSelectRiver = useCallback((slug: string) => {
    setSelectedSlug(slug);
  }, []);

  return (
    <main className="bg-canvas text-ink">
      {/* ── Kepala halaman ───────────────────────────────────────────── */}
      <header className="relative isolate overflow-hidden border-b border-editorial bg-brand-deep px-5 pb-10 pt-12 text-white sm:px-8 md:pb-14 md:pt-16">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-28 -top-28 -z-10 h-80 w-80 rounded-full bg-brand-primary opacity-25 blur-3xl"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 left-10 -z-10 h-64 w-64 rounded-full bg-brand-accent opacity-10 blur-3xl"
        />

        <div className="mx-auto flex max-w-7xl flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="animate-fade-up">
            <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-brand-accent">
              <span aria-hidden="true" className="h-px w-8 shrink-0 bg-brand-accent opacity-70" />
              Peta Pemantauan Nasional
            </p>

            <h1 className="text-display mt-4 font-display font-extrabold">Lokasi Pemantauan</h1>

            <p className="measure-editorial mt-5 text-base leading-relaxed text-white/80 md:text-lg">
              Tujuh daerah aliran sungai strategis dipantau setiap pekan oleh pos pantau
              Jagatirta dan jaringan Water Ranger. Pilih penanda di peta untuk membaca
              telemetri mutu air terakhir — pH, oksigen terlarut, dan padatan tersuspensi.
            </p>
          </div>

          <dl className="grid shrink-0 grid-cols-3 gap-px overflow-hidden rounded-2xl border border-white/15 bg-white/10 sm:min-w-[22rem]">
            <Metric label="DAS Dipantau" value={summary.total} />
            <Metric label="Kritis" value={summary.critical} tone="critical" />
            <Metric label="Waspada" value={summary.warning} tone="warning" />
          </dl>
        </div>
      </header>

      {/* ── Peta + panel detail ──────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-5 py-section-compact sm:px-8 md:py-section-compact">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:items-start lg:gap-10">
          {/* Pane peta — selalu di atas pada ponsel. */}
          <section aria-labelledby="peta-judul" className="min-w-0">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 id="peta-judul" className="font-display text-xl font-bold tracking-tight sm:text-2xl">
                  Peta sentinel tujuh sungai
                </h2>
                <p className="mt-1.5 text-sm text-ink-secondary">
                  Ketuk penanda berdenyut untuk memuat telemetri pos pantau.
                </p>
              </div>

              <p className="hidden items-center gap-2 font-mono text-xs text-ink-secondary sm:flex">
                <span aria-hidden="true" className="inline-block h-2 w-2 rounded-full bg-brand-primary" />
                Diperbarui {formatRelative(selectedRiver.lastUpdated)}
              </p>
            </div>

            {/*
              Satu instance peta dengan tinggi responsif via kelas pembungkus.
              Prop `height` disamakan dengan tinggi ponsel supaya skeleton
              pemuat mengisi ruang yang sama persis, lalu container Leaflet
              direntangkan penuh lewat CSS.
            */}
            <div className={cn('mt-5 [&>div]:h-full', MAP_HEIGHT_CLASS)}>
              <RiverMap
                rivers={rivers}
                height={MAP_HEIGHT_ATTR}
                selectedSlug={selectedRiver.slug}
                onSelectRiver={handleSelectRiver}
              />
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-2xl border border-editorial bg-surface px-5 py-4">
              <MapLegend />
              <p className="font-mono text-xs leading-tight text-ink-secondary">
                Sumber koordinat: pos pantau Jagatirta · WGS 84
              </p>
            </div>
          </section>

          {/* Pane detail — turun ke bawah peta pada ponsel. */}
          <aside aria-label="Detail sungai terpilih" className="min-w-0 lg:sticky lg:top-24">
            <div key={selectedRiver.slug} className="animate-fade-up motion-reduce:animate-none">
              <RiverDetailPanel river={selectedRiver} formattedDate={formatDate(selectedRiver.lastUpdated)} />
            </div>
          </aside>
        </div>

        {/* ── Daftar pemilih sungai ──────────────────────────────────── */}
        <section aria-labelledby="daftar-judul" className="mt-14 md:mt-20">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="daftar-judul" className="font-display text-xl font-bold tracking-tight sm:text-2xl">
                Seluruh pos pantau
              </h2>
              <p className="mt-1.5 text-sm text-ink-secondary">
                Diurutkan dari mutu air terburuk ke terbaik. Pilih kartu untuk memindahkan peta.
              </p>
            </div>
            <Badge tone="primary" dot>
              {summary.total} sungai
            </Badge>
          </div>

          <RiverSelector
            rivers={rankedRivers}
            selectedSlug={selectedRiver.slug}
            onSelect={handleSelectRiver}
          />
        </section>

        {/* ── Ajakan advokasi ────────────────────────────────────────── */}
        <section className="mt-14 md:mt-20">
          <Card className="border-editorial bg-brand-deep text-white">
            <CardBody className="flex flex-col gap-6 px-6 py-8 text-white sm:px-10 sm:py-10 lg:flex-row lg:items-center lg:justify-between lg:gap-12">
              <div className="max-w-2xl">
                <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                  Temukan bukti pencemaran di sungaimu?
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-white/80 sm:text-base">
                  Laporkan dengan foto bergeotag. Tim verifikasi Jagatirta menindaklanjuti
                  setiap laporan bersama pos pantau terdekat, dan laporan yang tervalidasi
                  masuk ke dossier sungai yang dapat diunduh siapa pun.
                </p>
              </div>

              <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col">
                <Button href="/lapor" variant="primary" size="lg">
                  Lapor Pencemaran
                </Button>
                <Button href="/volunteer" variant="secondary" size="lg">
                  Gabung Water Ranger
                </Button>
              </div>
            </CardBody>
          </Card>
        </section>
      </div>
    </main>
  );
}

/* ── Blok metrik kecil di kepala halaman ──────────────────────────── */

const METRIC_TONE = {
  critical: 'text-status-critical',
  warning: 'text-status-warning',
  neutral: 'text-brand-accent',
} as const;

interface MetricProps {
  label: string;
  value: number;
  tone?: keyof typeof METRIC_TONE;
}

/** Pemformat angka dibuat sekali per modul — `Intl.NumberFormat` mahal dibangun. */
const countFormatter = new Intl.NumberFormat('id-ID');

/** Satu angka ringkasan pada strip gelap; tanpa state, hanya presentasi. */
function Metric({ label, value, tone = 'neutral' }: MetricProps) {
  return (
    <div className="bg-brand-deep/40 px-4 py-4 sm:px-5">
      <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-white/85">
        {label}
      </dt>
      <dd
        className={cn(
          'mt-2 font-mono text-3xl font-bold leading-none tabular-nums',
          METRIC_TONE[tone],
        )}
      >
        {countFormatter.format(value)}
      </dd>
    </div>
  );
}
