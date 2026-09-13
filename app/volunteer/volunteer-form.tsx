'use client';

import { useCallback, useId, useMemo, useState } from 'react';
import type { FormEvent } from 'react';

import {
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  CheckboxGroup,
  Input,
  Select,
  Textarea,
  cn,
} from '@repo/ui';
import type { CheckboxGroupOption, SelectOption } from '@repo/ui';
import { rivers } from '@repo/data';

/* -------------------------------------------------------------------------- */
/*  Data                                                                       */
/* -------------------------------------------------------------------------- */

/** Domisili yang paling sering muncul di pos pantau Jagatirta. */
const CITIES: readonly string[] = [
  'Jakarta',
  'Bogor',
  'Bandung',
  'Semarang',
  'Surabaya',
  'Malang',
  'Solo',
  'Yogyakarta',
  'Balikpapan',
  'Samarinda',
  'Banjarmasin',
  'Palembang',
];

/**
 * Daftar sungai dibangun dari `rivers` (bukan salinan manual) sehingga label
 * selalu ikut nama resmi di basis data dan tidak pernah basi saat data tumbuh.
 */
const RIVER_OPTIONS: readonly SelectOption[] = rivers.map((river) => ({
  value: river.slug,
  label: `${river.name} — ${river.province}`,
}));

/** Gambaran singkat tiap bidang agar relawan tahu apa yang mereka pilih. */
const INTEREST_OPTIONS: readonly CheckboxGroupOption[] = [
  {
    value: 'Uji Air',
    label: 'Uji Air',
    description: 'Mengukur pH, oksigen terlarut, dan kekeruhan langsung di titik pantau.',
  },
  {
    value: 'Dokumentasi',
    label: 'Dokumentasi',
    description: 'Merekam foto, video, dan catatan lapangan untuk publikasi warga.',
  },
  {
    value: 'Logistik',
    label: 'Logistik',
    description: 'Menyiapkan alat uji, perahu, dan konsumsi untuk kegiatan lapangan.',
  },
  {
    value: 'Edukasi',
    label: 'Edukasi',
    description: 'Mendampingi sekolah dan warga bantaran memahami ekologi sungai.',
  },
  {
    value: 'Aksi Lapangan',
    label: 'Aksi Lapangan',
    description: 'Terjun pada patroli, pembersihan sungai, dan penanaman sempadan.',
  },
];

/** Batas minat: fokus dua bidang lebih berguna daripada hadir di semua bidang. */
const MAX_INTERESTS = 2;

/* -------------------------------------------------------------------------- */
/*  Tipe                                                                       */
/* -------------------------------------------------------------------------- */

interface FormValues {
  nama: string;
  whatsapp: string;
  email: string;
  domisili: string;
  sungai: string;
  minat: string[];
  motivasi: string;
}

type FieldErrors = Partial<Record<'nama' | 'whatsapp' | 'email' | 'domisili', string>>;

type SubmitState = 'idle' | 'pending' | 'success';

const EMPTY_VALUES: FormValues = {
  nama: '',
  whatsapp: '',
  email: '',
  domisili: '',
  sungai: '',
  minat: [],
  motivasi: '',
};

/* -------------------------------------------------------------------------- */
/*  Validasi                                                                   */
/* -------------------------------------------------------------------------- */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
/** Nomor Indonesia tanpa kode negara: 8xx…, panjang 9–13 digit. */
const WHATSAPP_PATTERN = /^8\d{8,12}$/;

/**
 * Validasi langkah pertama saja. Dipanggil persis saat "Lanjut" ditekan —
 * bukan di setiap ketikan — supaya pesan galat tidak muncul sebelum relawan
 * selesai mengetik satu kata pun.
 */
function validateIdentity(values: FormValues): FieldErrors {
  const errors: FieldErrors = {};

  const nama = values.nama.trim();
  if (nama.length === 0) errors.nama = 'Nama lengkap wajib diisi.';
  else if (nama.length < 3) errors.nama = 'Tuliskan nama lengkap minimal 3 karakter.';

  const whatsapp = values.whatsapp.replace(/[\s-]/g, '');
  if (whatsapp.length === 0) errors.whatsapp = 'Nomor WhatsApp wajib diisi.';
  else if (!WHATSAPP_PATTERN.test(whatsapp)) {
    errors.whatsapp = 'Masukkan nomor tanpa angka 0 atau +62 di depan, mis. 81234567890.';
  }

  const email = values.email.trim();
  if (email.length === 0) errors.email = 'Email wajib diisi.';
  else if (!EMAIL_PATTERN.test(email)) errors.email = 'Format email belum benar, mis. nama@email.com.';

  if (values.domisili.trim().length === 0) errors.domisili = 'Pilih domisili terdekat.';

  return errors;
}

/* -------------------------------------------------------------------------- */
/*  Ikon                                                                       */
/* -------------------------------------------------------------------------- */

function CheckCircleIcon() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 48 48"
      fill="none"
      className="h-12 w-12"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="24" cy="24" r="20" />
      <path d="M15 24.5 21 30.5 33 18" />
    </svg>
  );
}

/** Penanda langkah: angka, centang bila sudah lewat, atau titik bila belum aktif. */
function StepBadge({
  index,
  state,
}: {
  index: number;
  state: 'upcoming' | 'active' | 'done';
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 text-sm font-bold',
        'transition-colors duration-200 ease-crisp',
        state === 'active' && 'border-brand-primary bg-brand-primary text-white',
        state === 'done' && 'border-brand-primary bg-brand-soft text-brand-deep',
        state === 'upcoming' && 'border-editorial bg-surface-pure text-ink-secondary',
      )}
    >
      {state === 'done' ? (
        <svg
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
        >
          <path d="M3 8.4 6.2 11.6 13 4.8" />
        </svg>
      ) : (
        index
      )}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  Komponen                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Formulir pendaftaran Water Ranger.
 *
 * Dua langkah dengan pengungkapan bertahap: relawan lapangan harus bisa
 * menyelesaikannya di ponsel dalam waktu di bawah dua menit, jadi hanya empat
 * field yang tampil pada satu waktu. Langkah pertama divalidasi sebelum
 * berpindah, dan tidak ada backend — pengiriman disimulasikan dengan state
 * lokal beserta jeda singkat agar umpan baliknya jujur.
 */
export function VolunteerForm() {
  const [step, setStep] = useState<1 | 2>(1);
  const [values, setValues] = useState<FormValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitState, setSubmitState] = useState<SubmitState>('idle');

  const baseId = useId();
  const stepOneId = `${baseId}-langkah-1`;
  const stepTwoId = `${baseId}-langkah-2`;

  const isSuccess = submitState === 'success';
  const isPending = submitState === 'pending';

  /** Semua perubahan nilai membersihkan galat field terkait sekaligus. */
  const setField = useCallback(<K extends keyof FormValues>(key: K, next: FormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: next }));
    setErrors((prev) => {
      if (!(key in prev)) return prev;
      const rest = { ...prev };
      delete rest[key as keyof FieldErrors];
      return rest;
    });
  }, []);

  const handleNext = useCallback(() => {
    const found = validateIdentity(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setStep(2);
  }, [values]);

  const handleBack = useCallback(() => {
    setStep(1);
  }, []);

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      // Jaring pengaman: Enter di dalam form tidak boleh melewati validasi langkah 1.
      const found = validateIdentity(values);
      if (Object.keys(found).length > 0) {
        setErrors(found);
        setStep(1);
        return;
      }
      setErrors({});
      setSubmitState('pending');
      window.setTimeout(() => {
        setSubmitState('success');
      }, 900);
    },
    [values],
  );

  const selectedRiverLabel = useMemo(() => {
    const match = RIVER_OPTIONS.find((option) => option.value === values.sungai);
    return match ? match.label : null;
  }, [values.sungai]);

  if (isSuccess) {
    return (
      <Card
        role="status"
        aria-live="polite"
        className="border-brand-primary/40 shadow-lg animate-fade-up"
      >
        <CardBody className="flex flex-col items-center gap-5 px-6 py-10 text-center">
          <span className="grid h-20 w-20 place-items-center rounded-full bg-brand-soft text-brand-primary">
            <CheckCircleIcon />
          </span>
          <CardTitle as="h3" className="text-balance text-2xl sm:text-3xl">
            Terima kasih, pendaftaranmu tercatat!
          </CardTitle>
          <p className="measure-editorial text-base leading-relaxed text-ink-secondary">
            Koordinator wilayah akan menghubungimu lewat WhatsApp dalam 2–3 hari kerja untuk
            verifikasi data dan jadwal orientasi lapangan. Pastikan notifikasi WhatsApp tetap aktif
            agar pesan dari koordinator tidak terlewat.
          </p>
          <dl className="mt-2 w-full max-w-md text-left">
            <div className="flex items-baseline justify-between gap-4 border-b border-editorial py-3">
              <dt className="text-sm text-ink-secondary">Nama</dt>
              <dd className="text-sm font-semibold text-ink">{values.nama}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 border-b border-editorial py-3">
              <dt className="text-sm text-ink-secondary">WhatsApp</dt>
              <dd className="text-sm font-semibold text-ink">+62{values.whatsapp}</dd>
            </div>
            {selectedRiverLabel ? (
              <div className="flex items-baseline justify-between gap-4 border-b border-editorial py-3">
                <dt className="text-sm text-ink-secondary">Sungai pilihan</dt>
                <dd className="text-right text-sm font-semibold text-ink">{selectedRiverLabel}</dd>
              </div>
            ) : null}
            {values.minat.length > 0 ? (
              <div className="flex items-start justify-between gap-4 py-3">
                <dt className="text-sm text-ink-secondary">Bidang minat</dt>
                <dd className="text-right text-sm font-semibold text-ink">
                  {values.minat.join(', ')}
                </dd>
              </div>
            ) : null}
          </dl>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader divider>
        {/* Indikator langkah: selalu terlihat supaya relawan tahu sisa langkahnya. */}
        <ol className="flex flex-wrap items-center gap-x-4 gap-y-3" aria-label="Tahapan pendaftaran">
          <li className="flex items-center gap-3">
            <StepBadge index={1} state={step === 1 ? 'active' : 'done'} />
            <span className="flex flex-col">
              <span className="text-sm font-semibold text-ink">Data Diri</span>
              <span className="text-xs text-ink-secondary">
                {step === 1 ? 'Sedang diisi' : 'Selesai'}
              </span>
            </span>
          </li>
          <li aria-hidden="true" className="hidden h-px w-8 shrink-0 bg-editorial sm:block" />
          <li className="flex items-center gap-3">
            <StepBadge index={2} state={step === 2 ? 'active' : 'upcoming'} />
            <span className="flex flex-col">
              <span
                className={cn(
                  'text-sm font-semibold',
                  step === 2 ? 'text-ink' : 'text-ink-secondary',
                )}
              >
                Preferensi
              </span>
              <span className="text-xs text-ink-secondary">
                {step === 2 ? 'Sedang diisi' : 'Berikutnya'}
              </span>
            </span>
          </li>
        </ol>

        {/* Progres kuantitatif — pelengkap indikator, bukan penggantinya. */}
        <div
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={2}
          aria-valuenow={step}
          aria-label={`Langkah ${step} dari 2`}
          className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-editorial/60"
        >
          <span
            className="block h-full rounded-full bg-brand-primary transition-[width] duration-300 ease-crisp"
            style={{ width: step === 1 ? '50%' : '100%' }}
          />
        </div>
      </CardHeader>

      <form onSubmit={handleSubmit} noValidate>
        <CardBody className="px-6 py-6">
          {step === 1 ? (
            <div id={stepOneId} className="flex flex-col gap-5 animate-fade-up">
              <p className="text-sm text-ink-secondary">
                Empat kolom singkat, sekitar 40 detik. Data ini hanya dipakai koordinator untuk
                menghubungimu.
              </p>

              <Input
                label="Nama Lengkap"
                name="nama"
                value={values.nama}
                onChange={(event) => setField('nama', event.currentTarget.value)}
                error={errors.nama}
                placeholder="Contoh: Sari Puspita"
                autoComplete="name"
                required
              />

              <Input
                label="Nomor WhatsApp"
                name="whatsapp"
                type="tel"
                inputMode="tel"
                prefix="+62"
                value={values.whatsapp}
                onChange={(event) =>
                  setField('whatsapp', event.currentTarget.value.replace(/[^\d]/g, ''))
                }
                error={errors.whatsapp}
                hint="Tanpa angka 0 di depan, mis. 81234567890."
                placeholder="81234567890"
                autoComplete="tel-national"
                required
              />

              <Input
                label="Email"
                name="email"
                type="email"
                inputMode="email"
                value={values.email}
                onChange={(event) => setField('email', event.currentTarget.value)}
                error={errors.email}
                placeholder="nama@email.com"
                autoComplete="email"
                required
              />

              <Select
                label="Domisili"
                name="domisili"
                placeholder="Pilih kota terdekat"
                options={CITIES.map((city) => ({ value: city, label: city }))}
                value={values.domisili}
                onChange={(event) => setField('domisili', event.currentTarget.value)}
                error={errors.domisili}
                hint="Kami menempatkan relawan pada pos pantau terdekat."
                required
              />
            </div>
          ) : (
            <div id={stepTwoId} className="flex flex-col gap-5 animate-fade-up">
              <p className="text-sm text-ink-secondary">
                Terakhir, beri tahu kami di mana dan bagaimana kamu ingin terlibat.
              </p>

              <Select
                label="Sungai pilihan"
                name="sungai"
                placeholder="Pilih sungai yang ingin kamu jaga"
                options={RIVER_OPTIONS}
                value={values.sungai}
                onChange={(event) => setField('sungai', event.currentTarget.value)}
                hint="Boleh dilewati bila belum menentukan; koordinator akan membantu memilih."
              />

              <CheckboxGroup
                legend="Bidang minat"
                description="Pilih maksimal dua bidang agar waktumu terpakai fokus."
                options={INTEREST_OPTIONS}
                value={values.minat}
                onChange={(next) => setField('minat', next)}
                max={MAX_INTERESTS}
              />

              <Textarea
                label="Motivasi"
                name="motivasi"
                autoResize
                minHeight={120}
                maxHeight={240}
                value={values.motivasi}
                onChange={(event) => setField('motivasi', event.currentTarget.value)}
                hint="Ceritakan singkat kenapa kamu ingin menjaga sungai."
                placeholder="Contoh: Saya tinggal 200 meter dari Cisadane dan ingin ikut mengembalikan kualitas airnya."
              />
            </div>
          )}
        </CardBody>

        <CardBody className="flex flex-col-reverse gap-3 border-t border-editorial px-6 py-5 sm:flex-row sm:justify-between">
          {step === 2 ? (
            <Button type="button" variant="ghost" onClick={handleBack} disabled={isPending}>
              Kembali
            </Button>
          ) : (
            <span className="hidden text-sm text-ink-secondary sm:block">
              Langkah 1 dari 2
            </span>
          )}

          {step === 1 ? (
            <Button type="button" size="lg" onClick={handleNext} className="sm:min-w-44">
              Lanjut
            </Button>
          ) : (
            <Button type="submit" size="lg" loading={isPending} className="sm:min-w-56">
              {isPending ? 'Mengirim…' : 'Kirim Pendaftaran'}
            </Button>
          )}
        </CardBody>
      </form>
    </Card>
  );
}

export default VolunteerForm;
