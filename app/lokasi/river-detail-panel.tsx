import Link from 'next/link';

import {
  Badge,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  CardTitle,
  MetricBar,
  STATUS_LABELS,
  StatusPill,
  cn,
} from '@repo/ui';
import type { BadgeTone, River, RiverStatus } from '@repo/ui';

/** Label lengkap tiap status — dipakai pada baris ringkasan IKA. */
const STATUS_DETAIL: Record<RiverStatus, string> = {
  good: 'Mutu air memenuhi baku mutu kelas II',
  warning: 'Tercemar ringan — pengawasan pekanan diperketat',
  critical: 'Tercemar berat — butuh tindakan segera',
};

/** Warna nada badge mengikuti status sungai, tidak pernah hex di JSX. */
const STATUS_BADGE_TONE: Record<RiverStatus, BadgeTone> = {
  good: 'success',
  warning: 'warning',
  critical: 'danger',
};

/** Ambang baku mutu yang dipakai seluruh jagat pemantauan Jagatirta. */
const SAFE_RANGE = {
  ph: [6.5, 8.5] as [number, number],
  doMgL: [5, 14] as [number, number],
  tssMgL: [0, 50] as [number, number],
};

const IKA_FORMAT = new Intl.NumberFormat('id-ID', {
  maximumFractionDigits: 0,
});

const COORD_FORMAT = new Intl.NumberFormat('id-ID', {
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});

export interface RiverDetailPanelProps {
  river: River;
  /** Tanggal `lastUpdated` yang sudah diformat oleh pemanggil. */
  formattedDate: string;
}

/**
 * Panel detail sungai terpilih pada hub peta `/lokasi`.
 *
 * Server-compatible: menerima `river` sebagai prop dan tidak menyimpan state,
 * sehingga seleksi tetap dimiliki satu arah oleh halaman induk (client) —
 * peta, panel, dan daftar tidak pernah bisa saling bertentangan.
 */
export function RiverDetailPanel({ river, formattedDate }: RiverDetailPanelProps) {
  const dossierHref = `/lokasi/${river.slug}`;

  return (
    <Card className="overflow-hidden">
      <CardHeader divider className="gap-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <StatusPill
            status={river.status}
            size="md"
            detail={`IKA ${IKA_FORMAT.format(river.ikaScore)}`}
          />
          <Badge tone="neutral">Indeks {river.wasteIndex}</Badge>
        </div>

        <CardTitle as="h2" className="font-display text-3xl font-extrabold tracking-tight sm:text-[2.125rem]">
          Sungai {river.name}
        </CardTitle>

        <p className="flex items-center gap-2 text-sm font-medium text-ink-secondary">
          <PinIcon />
          {river.province}
        </p>
      </CardHeader>

      <CardBody className="space-y-7">
        {/* Skor IKA — angka paling penting di panel ini, dibaca lebih dulu. */}
        <div className="rounded-2xl border border-editorial bg-canvas px-5 py-5">
          <div className="flex items-baseline justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-secondary">
                Indeks Kualitas Air
              </p>
              <p className="mt-1 text-[11px] leading-snug text-ink-secondary">
                {STATUS_DETAIL[river.status]}
              </p>
            </div>

            <p className="flex shrink-0 items-baseline gap-1">
              <span className="font-mono text-4xl font-bold leading-none tabular-nums text-brand-deep">
                {IKA_FORMAT.format(river.ikaScore)}
              </span>
              <span className="font-mono text-xs font-medium text-ink-secondary">/100</span>
            </p>
          </div>

          {/*
            Track IKA memakai skala 0–100 tanpa `safeRange`, karena zona aman
            hanya bermakna untuk parameter fisik-kimia di bawah ini.
          */}
          <div className="mt-4">
            <MetricBar
              label="Indeks Kualitas Air (IKA)"
              value={river.ikaScore}
              min={0}
              max={100}
              status={river.status}
              hideHeader
              hint={`Status ${STATUS_LABELS[river.status]}`}
            />
          </div>
        </div>

        {/* Tiga parameter baku mutu, masing-masing dengan zona aman terarsir. */}
        <div className="space-y-6">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-secondary">
            Telemetri Lab Terakhir
          </h3>

          <MetricBar
            label="Derajat Keasaman (pH)"
            value={river.ph}
            min={0}
            max={14}
            safeRange={SAFE_RANGE.ph}
            status={river.status}
          />

          <MetricBar
            label="Oksigen Terlarut (DO)"
            value={river.doMgL}
            min={0}
            max={SAFE_RANGE.doMgL[1]}
            unit="mg/L"
            safeRange={SAFE_RANGE.doMgL}
            status={river.status}
          />

          <MetricBar
            label="Padatan Tersuspensi (TSS)"
            value={river.tssMgL}
            min={0}
            max={350}
            unit="mg/L"
            safeRange={SAFE_RANGE.tssMgL}
            status={river.status}
          />
        </div>

        {/* Isu pencemaran prioritas. */}
        <div>
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-secondary">
            Isu Prioritas
          </h3>
          <ul className="mt-3 flex flex-wrap gap-2">
            {river.issues.map((issue) => (
              <li key={issue}>
                <Badge tone={STATUS_BADGE_TONE[river.status]} dot>
                  {issue}
                </Badge>
              </li>
            ))}
          </ul>
        </div>

        {/* Jejak verifikasi — siapa, kapan, di mana. */}
        <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-editorial bg-editorial sm:grid-cols-3">
          <MetaCell label="Diperbarui" value={formattedDate} />
          <MetaCell label="Verifikator" value={river.verifier} />
          <MetaCell
            label="Koordinat"
            value={`${COORD_FORMAT.format(river.coordinates.lat)}, ${COORD_FORMAT.format(river.coordinates.lng)}`}
            mono
          />
        </dl>

        <p className="text-xs leading-relaxed text-ink-secondary">
          Data diambil dari sampel pos pantau paling akhir, diverifikasi laboratorium
          mitra Jagatirta. Status dievaluasi ulang setiap pekan dan dapat berubah sebelum
          jadwal berikutnya.
        </p>
      </CardBody>

      <CardFooter divider className="flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <Button href={dossierHref} className="w-full sm:w-auto">
          Buka dossier lengkap
          <ArrowIcon />
        </Button>

        <Link
          href="/lapor"
          className={cn(
            'inline-flex min-h-12 items-center justify-center gap-1.5 rounded-xl px-2',
            'text-sm font-semibold text-brand-deep underline decoration-brand-primary/40',
            'underline-offset-4 transition-colors duration-200 ease-crisp hover:decoration-brand-primary',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent',
            'focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
          )}
        >
          Laporkan temuan di {river.name}
        </Link>
      </CardFooter>
    </Card>
  );
}

/* ── Potongan kecil ──────────────────────────────────────────────── */

interface MetaCellProps {
  label: string;
  value: string;
  mono?: boolean;
}

/** Satu sel pada kisi metadata; kunci di atas, nilai di bawah. */
function MetaCell({ label, value, mono = false }: MetaCellProps) {
  return (
    <div className="bg-surface px-5 py-4">
      <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-secondary">
        {label}
      </dt>
      <dd
        className={cn(
          'mt-1.5 text-sm font-semibold leading-snug text-ink',
          mono && 'font-mono text-xs tabular-nums',
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function PinIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="h-4 w-4 shrink-0 text-brand-primary"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M10 17.5s6-5.1 6-9.4A6 6 0 0 0 4 8.1c0 4.3 6 9.4 6 9.4Z" strokeLinejoin="round" />
      <circle cx="10" cy="8" r="2.2" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="h-4 w-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M4 10h11M11 5.5 15.5 10 11 14.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default RiverDetailPanel;
