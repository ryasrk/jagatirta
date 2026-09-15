'use client';

import { useCallback, useId, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';

import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Input,
  Select,
  Textarea,
  cn,
} from '@repo/ui';
import { rivers } from '@repo/data';
import type { River } from '@repo/ui/types';

/* -------------------------------------------------------------------------- */
/*  Konstanta                                                                  */
/* -------------------------------------------------------------------------- */

/** Opsi 'Sungai' dibangun dari data sungai — nama DAS dan provinsinya terbaca. */
const RIVER_OPTIONS = rivers.map((river) => ({
  value: river.slug,
  label: `${river.name} — ${river.province}`,
}));

/**
 * Jenis pencemaran mengikuti bahasa yang dipakai warga, bukan istilah teknis
 * laboratorium: pelapor di lapangan memilih "Bau menyengat", bukan "H₂S".
 */
const POLLUTION_OPTIONS = [
  { value: 'limbah-industri-cair', label: 'Limbah industri cair' },
  { value: 'sampah-domestik', label: 'Sampah domestik' },
  { value: 'sedimentasi-keruh', label: 'Sedimentasi atau air keruh' },
  { value: 'bau-menyengat', label: 'Bau menyengat' },
  { value: 'lainnya', label: 'Lainnya' },
] as const;

/** Batas deskripsi: cukup untuk kronologi, tetap muat dikirim dari jaringan 3G. */
const DESCRIPTION_MAX = 1200;

/** Ambang "arahkan ke DLH": empat jenis ini selalu memerlukan tindak lanjut resmi. */
const ESCALATION_TYPES = new Set([
  'limbah-industri-cair',
  'sedimentasi-keruh',
  'bau-menyengat',
]);

const GEO_TIMEOUT_MS = 12_000;
const GEO_MAX_AGE_MS = 5 * 60 * 1000;

/* -------------------------------------------------------------------------- */
/*  Tipe                                                                       */
/* -------------------------------------------------------------------------- */

interface FormValues {
  riverSlug: string;
  location: string;
  description: string;
  pollutionType: string;
  contactable: boolean;
}

interface FormErrors {
  riverSlug?: string;
  location?: string;
  description?: string;
  pollutionType?: string;
}

interface Coordinates {
  lat: string;
  lng: string;
  /** Akurasi dalam meter seperti dilaporkan perangkat, untuk disalin ke laporan. */
  accuracy: number | null;
}

interface ReportReceipt {
  reference: string;
  /** Sudah diformat agar kopi pesan penutup tidak bergantung pada locale runtime. */
  submittedAtLabel: string;
  riverName: string;
  pollutionLabel: string;
  location: string;
  contactable: boolean;
  hasPhoto: boolean;
  hasCoordinates: boolean;
  /** `true` bila jenis pencemaran lazimnya diteruskan ke DLH. */
  escalateToDlh: boolean;
}

type GeoStatus = 'idle' | 'locating' | 'success' | 'error';

const EMPTY_VALUES: FormValues = {
  riverSlug: '',
  location: '',
  description: '',
  pollutionType: '',
  contactable: false,
};

/* -------------------------------------------------------------------------- */
/*  Utilitas                                                                   */
/* -------------------------------------------------------------------------- */

const MONTH_CODES = [
  'JAN',
  'FEB',
  'MAR',
  'APR',
  'MEI',
  'JUN',
  'JUL',
  'AGU',
  'SEP',
  'OKT',
  'NOV',
  'DES',
] as const;

/** 4 angka acak — permutasi 10.000, cukup untuk rujukan lisan di lapangan. */
function randomBlock(): string {
  return String(Math.floor(Math.random() * 10_000)).padStart(4, '0');
}

/**
 * Nomor rujukan yang bisa dibacakan lewat telepon: LAP-TAHUN-BULANHARI-URUT.
 * Tanggalnya memakai waktu lokal perangkat karena pelapor menyebut "hari ini",
 * bukan UTC.
 */
function buildReference(now: Date): string {
  const year = String(now.getFullYear());
  const month = MONTH_CODES[now.getMonth()] ?? 'JAN';
  const day = String(now.getDate()).padStart(2, '0');
  return `LAP-${year}-${month}${day}-${randomBlock()}`;
}

function formatSubmittedAt(now: Date): string {
  const day = String(now.getDate()).padStart(2, '0');
  const month = MONTH_CODES[now.getMonth()] ?? 'JAN';
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${day} ${month} ${now.getFullYear()}, ${hours}.${minutes} WIB`;
}

/** 6 desimal ≈ 11 cm — presisi GPS ponsel, tanpa angka palsu di belakangnya. */
function formatCoordinate(value: number): string {
  return value.toFixed(6);
}

function findRiver(slug: string): River | undefined {
  return rivers.find((river) => river.slug === slug);
}

function pollutionLabel(value: string): string {
  return POLLUTION_OPTIONS.find((option) => option.value === value)?.label ?? 'Belum ditentukan';
}

/* -------------------------------------------------------------------------- */
/*  Pesan galat geolokasi                                                      */
/* -------------------------------------------------------------------------- */

/**
 * `navigator.geolocation` tidak ada di sejumlah browser lama, di dalam iframe
 * ber-sandbox, dan pada konteks yang tidak aman (http). Kasus itu diperlakukan
 * sama seperti galat lain: pesan Bahasa Indonesia yang menjelaskan langkah
 * berikutnya, bukan pengecualian yang menjatuhkan halaman.
 */
function geolocationMessage(error: GeolocationPositionError): string {
  switch (error.code) {
    case 1:
      return 'Izin lokasi ditolak. Aktifkan izin lokasi untuk situs ini di pengaturan browser, lalu coba lagi — atau isi patokan lokasi secara manual.';
    case 2:
      return 'Lokasi tidak tersedia saat ini. Sinyal GPS mungkin lemah karena berada di dalam ruangan atau di bawah pepohonan. Coba lagi di tempat terbuka.';
    case 3:
      return 'Pencarian lokasi memakan waktu terlalu lama. Coba lagi sebentar, atau isi patokan lokasi secara manual.';
    default:
      return 'Lokasi tidak dapat dibaca perangkat ini. Isi patokan lokasi secara manual agar laporan tetap dapat diverifikasi.';
  }
}

function isPermissionDenied(error: unknown): boolean {
  if (error instanceof DOMException) return error.name === 'NotAllowedError';
  return typeof error === 'object' && error !== null && 'name' in error
    ? (error as { name?: unknown }).name === 'NotAllowedError'
    : false;
}

/* -------------------------------------------------------------------------- */
/*  Ikon inline                                                                */
/* -------------------------------------------------------------------------- */

function TargetIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="10" cy="10" r="6.6" />
      <circle cx="10" cy="10" r="2.4" />
      <path d="M10 1v2.2M10 16.8V19M1 10h2.2M16.8 10H19" />
    </svg>
  );
}

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M2.5 6.6h2.9l1.3-2h6.6l1.3 2h2.9c.6 0 1 .4 1 1v7.2c0 .6-.4 1-1 1H2.5c-.6 0-1-.4-1-1V7.6c0-.6.4-1 1-1Z" />
      <circle cx="10" cy="11" r="3.1" />
    </svg>
  );
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
    >
      <path
        fillRule="evenodd"
        d="M8.6 2.7a1.6 1.6 0 0 1 2.8 0l6.4 11.6a1.6 1.6 0 0 1-1.4 2.4H3.6a1.6 1.6 0 0 1-1.4-2.4L8.6 2.7Zm1.4 4a.9.9 0 0 0-.9.9v3.6a.9.9 0 0 0 1.8 0V7.6a.9.9 0 0 0-.9-.9Zm0 8.5a1.1 1.1 0 1 0 0-2.2 1.1 1.1 0 0 0 0 2.2Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function CheckSealIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      <circle cx="12" cy="12" r="10.2" stroke="currentColor" strokeWidth="1.6" opacity="0.35" />
      <path
        d="M7.4 12.4 10.6 15.6 16.7 9"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*  Komponen kecil                                                             */
/* -------------------------------------------------------------------------- */

/** Kepala field yang dapat dipakai di luar komponen form (mis. catatan bantuan). */
function StatusNote({
  status,
  message,
  hint,
}: {
  status: GeoStatus;
  message: string | null;
  hint: string;
}) {
  if (status === 'locating') {
    return (
      <p className="flex items-center gap-2 text-sm font-medium text-ink-secondary">
        <span
          aria-hidden="true"
          className="h-2 w-2 shrink-0 animate-pulse-ring rounded-full bg-brand-accent"
        />
        Mencari titik lokasimu…
      </p>
    );
  }

  if (status === 'error' && message) {
    return (
      <p role="alert" className="flex items-start gap-2 text-sm font-medium text-status-critical">
        <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
        <span>{message}</span>
      </p>
    );
  }

  return <p className="text-sm text-ink-secondary">{hint}</p>;
}

/* -------------------------------------------------------------------------- */
/*  Formulir                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Meja lapor pencemaran berbasis formulir terkendali.
 *
 * Ada satu alasan mengapa seluruh nilai hidup di state React, bukan di DOM:
 * laporan harus dapat dikirim dari jaringan lemah. Saat pengiriman gagal, isi
 * laporan tidak boleh hilang — jadi setiap field dikendalikan, divalidasi
 * sebelum "dikirim", dan hasilnya diringkas di kartu rujukan, bukan dikosongkan.
 */
export function LaporForm() {
  const [values, setValues] = useState<FormValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<FormErrors>({});
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [geoStatus, setGeoStatus] = useState<GeoStatus>('idle');
  const [geoMessage, setGeoMessage] = useState<string | null>(null);
  const [photoLabel, setPhotoLabel] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<ReportReceipt | null>(null);
  const [submitting, setSubmitting] = useState(false);
  /** Umpan balik aksi "salin": ditampilkan singkat setelah clipboard diperbarui. */
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const formId = useId();
  const receiptHeadingId = `${formId}-receipt`;
  const noticeId = `${formId}-notice`;
  const photoHelpId = `${formId}-photo-help`;
  const geoHelpId = `${formId}-geo-help`;

  const selectedRiver = useMemo(() => findRiver(values.riverSlug), [values.riverSlug]);
  const hasPhoto = photoLabel !== null;

  const update = useCallback(<K extends keyof FormValues>(key: K, next: FormValues[K]) => {
    setValues((previous) => ({ ...previous, [key]: next }));
  }, []);

  /* ── Geotagging ─────────────────────────────────────────────────────────── */

  const requestLocation = useCallback(() => {
    setGeoStatus('locating');
    setGeoMessage(null);

    if (typeof window === 'undefined' || !window.isSecureContext) {
      setGeoStatus('error');
      setGeoMessage(
        'Browser memblokir layanan lokasi pada koneksi tidak aman (http). Buka situs ini melalui https, atau isi patokan lokasi secara manual.',
      );
      return;
    }

    if (!('geolocation' in navigator) || typeof navigator.geolocation?.getCurrentPosition !== 'function') {
      setGeoStatus('error');
      setGeoMessage(
        'Perangkat atau browser ini belum mendukung layanan lokasi. Isi patokan lokasi secara manual — keterangan yang jelas tetap membuat laporanmu dapat diverifikasi.',
      );
      return;
    }

    try {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoords({
            lat: formatCoordinate(position.coords.latitude),
            lng: formatCoordinate(position.coords.longitude),
            accuracy:
              Number.isFinite(position.coords.accuracy) && position.coords.accuracy > 0
                ? Math.round(position.coords.accuracy)
                : null,
          });
          setGeoStatus('success');
          setGeoMessage(null);
        },
        (geoError) => {
          setGeoStatus('error');
          setGeoMessage(geolocationMessage(geoError));
        },
        {
          enableHighAccuracy: true,
          timeout: GEO_TIMEOUT_MS,
          maximumAge: GEO_MAX_AGE_MS,
        },
      );
    } catch (thrown: unknown) {
      // Safari lama melempar sinkron saat API dipanggil dari konteks terlarang.
      setGeoStatus('error');
      setGeoMessage(
        isPermissionDenied(thrown)
          ? 'Izin lokasi ditolak. Aktifkan izin lokasi untuk situs ini, lalu tekan "Gunakan lokasi saya" sekali lagi.'
          : 'Lokasi tidak dapat dibaca perangkat ini. Isi patokan lokasi secara manual agar laporan tetap dapat diverifikasi.',
      );
    }
  }, []);

  const clearLocation = useCallback(() => {
    setCoords(null);
    setGeoStatus('idle');
    setGeoMessage(null);
  }, []);

  /* ── Foto ───────────────────────────────────────────────────────────────── */

  const handlePhotoChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    setPhotoLabel(file ? file.name : null);
  }, []);

  const clearPhoto = useCallback(() => {
    setPhotoLabel(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  /* ── Validasi & pengiriman ──────────────────────────────────────────────── */

  const validate = useCallback((): FormErrors => {
    const next: FormErrors = {};

    if (values.riverSlug.trim().length === 0) {
      next.riverSlug = 'Pilih sungai tempat kejadian berlangsung.';
    }
    if (values.location.trim().length < 3) {
      next.location = 'Tulis minimal tiga karakter, mis. "jembatan Desa Sukamaju" atau nama patokan terdekat.';
    }
    if (values.pollutionType.trim().length === 0) {
      next.pollutionType = 'Pilih satu jenis pencemaran yang paling mendekati.';
    }
    if (values.description.trim().length < 20) {
      next.description = 'Tulis minimal 20 karakter: apa yang terlihat, kapan, dan seberapa luas dampaknya.';
    }

    return next;
  }, [values]);

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const nextErrors = validate();
      setErrors(nextErrors);

      // Urutan fokus mengikuti urutan field di layar, bukan urutan objek galat.
      const firstInvalid: keyof FormErrors | null =
        nextErrors.riverSlug !== undefined
          ? 'riverSlug'
          : nextErrors.location !== undefined
            ? 'location'
            : nextErrors.pollutionType !== undefined
              ? 'pollutionType'
              : nextErrors.description !== undefined
                ? 'description'
                : null;

      if (firstInvalid) {
        // Field tanpa `id` sendiri (mis. readOnly) tetap difokuskan lewat label.
        const target = document.getElementById(`${formId}-${firstInvalid}`);
        if (target instanceof HTMLElement) target.focus();
        return;
      }

      setSubmitting(true);

      // Tidak ada backend di meja lapor ini: server pengganti belum dipasang, jadi
      // pengiriman disimulasikan sepenuhnya di state klien. Nomor rujukan dibuat
      // di sini dan laporan dianggap tercatat — kartu rujukan di bawah adalah
      // bukti tunggal yang dipegang pelapor sampai API laporan tersedia.
      const now = new Date();
      setReceipt({
        reference: buildReference(now),
        submittedAtLabel: formatSubmittedAt(now),
        riverName: selectedRiver?.name ?? 'Sungai belum dipilih',
        pollutionLabel: pollutionLabel(values.pollutionType),
        location: values.location.trim(),
        contactable: values.contactable,
        hasPhoto,
        hasCoordinates: coords !== null,
        escalateToDlh: ESCALATION_TYPES.has(values.pollutionType),
      });
      setSubmitting(false);
    },
    [coords, formId, hasPhoto, selectedRiver, validate, values],
  );

  const handleReset = useCallback(() => {
    setReceipt(null);
    setCopied(false);
    setValues(EMPTY_VALUES);
    setErrors({});
    setCoords(null);
    setGeoStatus('idle');
    setGeoMessage(null);
    clearPhoto();
  }, [clearPhoto]);

  /**
   * Menyalin nomor rujukan. Penolakan clipboard (izin, konteks tidak aman, atau
   * browser tanpa `navigator.clipboard`) tidak pernah menjadi galat yang terlihat:
   * nomornya sudah terbaca besar di layar dan bisa dicatat dengan tangan.
   */
  const copyReference = useCallback((reference: string) => {
    const clipboard = typeof navigator === 'undefined' ? undefined : navigator.clipboard;
    if (!clipboard || typeof clipboard.writeText !== 'function') return;
    clipboard
      .writeText(reference)
      .then(() => setCopied(true))
      .catch(() => {
        /* Diabaikan dengan sengaja — nomor tetap tampil di layar. */
      });
  }, []);

  /* ── Kartu rujukan ──────────────────────────────────────────────────────── */

  if (receipt) {
    const steps = [
      'Diverifikasi: koordinator sungai mencocokkan laporanmu dengan citra satelit dan catatan pos pantau.',
      'Diselidiki tim patroli: petugas mengambil sampel dan mendokumentasikan titik kejadian di lapangan.',
      receipt.escalateToDlh
        ? 'Diterbitkan ke peta publik: setelah bukti terkumpul, jenis laporan ini kami eskalasikan ke Dinas Lingkungan Hidup.'
        : 'Diterbitkan ke peta: lokasi laporanmu ditandai di peta terbuka bersama temuan relawan lain.',
    ];

    return (
      <Card
        className="border-brand-primary/35 shadow-lg animate-fade-up motion-reduce:animate-none"
        aria-labelledby={receiptHeadingId}
      >
        <CardHeader
          divider
          action={<Badge tone="success">Laporan terkirim</Badge>}
          className="bg-brand-soft/45"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-primary">
            Nomor rujukan laporan
          </p>
          <CardTitle as="h2" id={receiptHeadingId} className="mt-2">
            <span className="font-mono text-2xl tracking-tight text-brand-deep sm:text-3xl">
              {receipt.reference}
            </span>
          </CardTitle>
          <p className="mt-2 text-sm text-ink-secondary">
            Dicatat {receipt.submittedAtLabel} · Sungai {receipt.riverName}
          </p>
        </CardHeader>

        <CardBody className="space-y-6">
          <p className="text-sm leading-relaxed text-ink">
            Simpan atau salin nomor ini. Setiap pertanyaan lanjutan tentang laporanmu akan
            ditelusuri lewat nomor tersebut, jadi sebutkan nomor ini saat menghubungi kami.
          </p>

          <p aria-live="polite" className="sr-only">
            {copied ? `Nomor rujukan ${receipt.reference} berhasil disalin.` : ''}
          </p>

          <div className="rounded-2xl border border-editorial bg-canvas p-4 sm:p-5">
            <p className="flex items-center gap-2 text-sm font-semibold text-ink">
              <CheckSealIcon className="h-5 w-5 shrink-0 text-brand-primary" />
              Laporanmu akan diverifikasi koordinator sungai sebelum tampil di peta publik.
            </p>
            <ol className="mt-4 space-y-3">
              {steps.map((step, index) => (
                <li key={step} className="flex items-start gap-3">
                  <span
                    aria-hidden="true"
                    className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-primary text-xs font-bold text-white"
                  >
                    {index + 1}
                  </span>
                  <span className="text-sm leading-relaxed text-ink-secondary">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <dl className="grid gap-x-6 gap-y-4 border-t border-editorial pt-5 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-secondary">
                Jenis pencemaran
              </dt>
              <dd className="mt-1 text-sm font-medium text-ink">{receipt.pollutionLabel}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-secondary">
                Lokasi atau patokan
              </dt>
              <dd className="mt-1 text-sm font-medium text-ink">{receipt.location}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-secondary">
                Bukti yang dilampirkan
              </dt>
              <dd className="mt-1 text-sm font-medium text-ink">
                {receipt.hasPhoto ? 'Foto lokasi' : 'Tanpa foto'}
                {receipt.hasCoordinates ? ' · titik koordinat GPS' : ' · tanpa titik GPS'}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-secondary">
                Diikuti tindak lanjut
              </dt>
              <dd className="mt-1 text-sm font-medium text-ink">
                {receipt.contactable
                  ? 'Ya — relawan boleh menghubungi kembali'
                  : 'Tidak dihubungi kembali; laporan tetap diproses'}
              </dd>
            </div>
          </dl>

          {receipt.escalateToDlh ? (
            <p className="rounded-2xl border border-status-warning/40 bg-status-warning/10 p-4 text-sm leading-relaxed text-ink">
              <strong className="font-semibold">Perlu Anda ketahui:</strong> jenis pencemaran ini
              lazimnya memerlukan surat resmi. Tim advokasi akan menyiapkan eskalasi ke Dinas
              Lingkungan Hidup dan mencatatnya dengan nomor rujukan yang sama.
            </p>
          ) : null}
        </CardBody>

        <div className="mt-auto flex flex-wrap items-center gap-3 border-t border-editorial px-5 py-5 sm:px-6">
          <Button
            type="button"
            variant="secondary"
            className="w-full sm:w-auto"
            onClick={() => copyReference(receipt.reference)}
          >
            {copied ? 'Nomor tersalin' : 'Salin nomor rujukan'}
          </Button>
          <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={handleReset}>
            Buat laporan baru
          </Button>
        </div>
      </Card>
    );
  }

  /* ── Formulir ───────────────────────────────────────────────────────────── */

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      className="flex flex-col gap-8"
      aria-describedby={noticeId}
    >
      <fieldset className="flex flex-col gap-6 border-0 p-0">
        <legend className="mb-2 font-display text-lg font-semibold text-ink">
          1. Di mana kejadiannya?
        </legend>

        <Select
          id={`${formId}-riverSlug`}
          label="Sungai"
          placeholder="Pilih sungai tempat kejadian"
          options={RIVER_OPTIONS}
          value={values.riverSlug}
          onChange={(event) => update('riverSlug', event.currentTarget.value)}
          error={errors.riverSlug}
          hint={
            selectedRiver
              ? `Status terakhir: ${selectedRiver.wasteIndex.toLowerCase()} — dipantau ${selectedRiver.verifier}.`
              : 'Pilih daerah aliran sungai terdekat, walau titik kejadian ada di anak sungai.'
          }
          required
        />

        <Input
          id={`${formId}-location`}
          label="Lokasi atau patokan"
          placeholder="Contoh: 200 m hilir Jembatan Desa Sukamaju, RT 03"
          value={values.location}
          onChange={(event) => update('location', event.currentTarget.value)}
          error={errors.location}
          hint="Sebutkan patokan yang dikenali warga setempat — jembatan, pabrik, sekolah, atau nama kampung."
          autoComplete="off"
          enterKeyHint="next"
          required
        />

        <div className="rounded-2xl border border-editorial bg-surface-pure p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <TargetIcon className="mt-0.5 h-5 w-5 shrink-0 text-brand-primary" />
              <div>
                <p className="text-sm font-semibold text-ink">Titik koordinat</p>
                <p id={geoHelpId} className="mt-0.5 text-sm text-ink-secondary">
                  Opsional, tetapi sangat mempercepat verifikasi di peta.
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="w-full sm:w-auto"
              loading={geoStatus === 'locating'}
              onClick={requestLocation}
              aria-describedby={geoHelpId}
            >
              <TargetIcon className="h-4 w-4" />
              Gunakan lokasi saya
            </Button>
          </div>

          <div className="mt-4 grid gap-grid-tight sm:grid-cols-2">
            <Input
              label="Latitude"
              readOnly
              placeholder="—"
              value={coords?.lat ?? ''}
              hint={coords ? 'Titik dari perangkatmu' : 'Terisi otomatis dari GPS ponsel'}
              inputClassName="font-mono tabular-nums"
              autoComplete="off"
            />
            <Input
              label="Longitude"
              readOnly
              placeholder="—"
              value={coords?.lng ?? ''}
              hint={coords ? 'Titik dari perangkatmu' : 'Terisi otomatis dari GPS ponsel'}
              inputClassName="font-mono tabular-nums"
              autoComplete="off"
            />
          </div>

          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <StatusNote
              status={geoStatus}
              message={geoMessage}
              hint={
                coords
                  ? coords.accuracy !== null
                    ? `Lokasi tersimpan dengan akurasi ±${coords.accuracy} m.`
                    : 'Lokasi tersimpan dari perangkatmu.'
                  : 'Kamu juga bisa mengetik koordinat sendiri bila sudah menandainya di peta.'
              }
            />
            {coords ? (
              <Button type="button" variant="ghost" size="sm" onClick={clearLocation}>
                Hapus titik
              </Button>
            ) : null}
          </div>
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-6 border-0 p-0">
        <legend className="mb-2 font-display text-lg font-semibold text-ink">
          2. Apa yang kamu saksikan?
        </legend>

        <Select
          id={`${formId}-pollutionType`}
          label="Jenis pencemaran"
          placeholder="Pilih jenis yang paling mendekati"
          options={POLLUTION_OPTIONS}
          value={values.pollutionType}
          onChange={(event) => update('pollutionType', event.currentTarget.value)}
          error={errors.pollutionType}
          hint="Pilih satu. Bila ada beberapa jenis, tuliskan sisanya di kolom deskripsi."
          required
        />

        <Textarea
          id={`${formId}-description`}
          label="Deskripsi kejadian"
          placeholder="Contoh: Selasa pagi air berubah hitam pekat dan berbuih sepanjang ±50 meter. Bau menyengat menyebar sampai sekolah. Ikan kecil terlihat mati di tepi."
          value={values.description}
          onChange={(event) => update('description', event.currentTarget.value)}
          error={errors.description}
          hint="Kronologi singkat: kapan mulai terlihat, seberapa luas, dan apa dampaknya bagi warga sekitar."
          rows={6}
          maxLength={DESCRIPTION_MAX}
          showCounter
          autoResize
          maxHeight={380}
          required
        />

        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <CameraIcon className="mt-0.5 h-5 w-5 shrink-0 text-brand-primary" />
            <div>
              <p className="text-sm font-semibold text-ink">
                Foto lokasi <span className="font-normal text-ink-secondary">(opsional)</span>
              </p>
              <label
                htmlFor={`${formId}-photo`}
                className={cn(
                  'mt-3 flex min-h-12 cursor-pointer items-center justify-center gap-2.5 rounded-xl',
                  'border-2 border-dashed border-editorial bg-surface-pure px-4 py-3',
                  'text-sm font-semibold text-ink transition-colors duration-200 ease-crisp',
                  'hover:border-brand-primary hover:bg-brand-soft/40',
                  'focus-within:ring-2 focus-within:ring-brand-primary/40',
                )}
              >
                <CameraIcon className="h-5 w-5 shrink-0 text-brand-primary" />
                <span>{hasPhoto ? 'Ganti foto' : 'Ambil atau pilih foto'}</span>
              </label>
              <input
                ref={fileInputRef}
                id={`${formId}-photo`}
                name="photo"
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoChange}
                aria-describedby={photoHelpId}
                className="sr-only"
              />
            </div>
          </div>

          {hasPhoto ? (
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-brand-primary/35 bg-brand-soft/40 px-4 py-3">
              <p className="min-w-0 flex-1 text-sm font-medium text-ink">
                <span className="sr-only">Berkas terpilih: </span>
                <span className="block truncate">{photoLabel}</span>
              </p>
              <Button type="button" variant="ghost" size="sm" onClick={clearPhoto}>
                Hapus foto
              </Button>
            </div>
          ) : null}

          <p id={photoHelpId} className="text-sm text-ink-secondary">
            Di ponsel, tombol ini langsung membuka kamera belakang. Pastikan air atau sumber limbah
            terlihat jelas, dan sertakan satu sudut lebar yang menunjukkan posisi terhadap tepi sungai.
          </p>
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-6 border-0 p-0">
        <legend className="mb-2 font-display text-lg font-semibold text-ink">
          3. Boleh kami hubungi?
        </legend>

        <label
          htmlFor={`${formId}-contactable`}
          className={cn(
            'flex min-h-12 cursor-pointer items-start gap-3.5 rounded-2xl border-2 p-4',
            'transition-colors duration-200 ease-crisp',
            values.contactable
              ? 'border-brand-primary bg-brand-soft'
              : 'border-editorial bg-surface-pure hover:border-brand-primary/55',
          )}
        >
          <input
            id={`${formId}-contactable`}
            name="contactable"
            type="checkbox"
            checked={values.contactable}
            onChange={(event) => update('contactable', event.currentTarget.checked)}
            className="peer sr-only"
          />          <span
            aria-hidden="true"
            className={cn(
              'mt-0.5 grid h-[22px] w-[22px] shrink-0 place-items-center rounded-[7px] border-2',
              'transition-colors duration-200 ease-crisp',
              values.contactable
                ? 'border-brand-primary bg-brand-primary text-white'
                : 'border-editorial bg-surface-pure text-transparent',
              'peer-focus-visible:ring-2 peer-focus-visible:ring-brand-primary/40 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-canvas',
            )}
          >
            <svg
              aria-hidden="true"
              focusable="false"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-3.5 w-3.5"
            >
              <path d="M3 8.4 6.2 11.6 13 4.8" />
            </svg>
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold leading-6 text-ink">
              Bersedia dihubungi kembali
            </span>
            <span className="mt-0.5 block text-sm leading-5 text-ink-secondary">
              Koordinator sungai mungkin perlu menanyakan satu dua detail sebelum laporan
              diterbitkan ke peta publik.
            </span>
          </span>
        </label>
      </fieldset>

      <p
        id={noticeId}
        className="rounded-2xl border border-status-warning/40 bg-status-warning/10 p-4 text-sm leading-relaxed text-ink"
      >
        <strong className="font-semibold">Laporan palsu merugikan relawan lapangan.</strong> Setiap
        laporan diverifikasi manual oleh orang yang harus meninggalkan pekerjaan dan menempuh jalan
        berlumpur untuk memeriksanya. Satu laporan palsu berarti satu titik pantau sungai lain tidak
        sempat diperiksa hari itu. Tulis hanya apa yang benar-benar kamu lihat.
      </p>

      <div className="flex flex-col gap-4 border-t border-editorial pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-md text-sm text-ink-secondary">
          Dengan mengirim laporan, kamu menyatakan keterangan ini benar dan boleh dipakai Jagatirta
          untuk verifikasi lapangan.
        </p>
        <Button type="submit" size="lg" loading={submitting} className="w-full sm:w-auto">
          Kirim laporan
        </Button>
      </div>
    </form>
  );
}

export default LaporForm;
