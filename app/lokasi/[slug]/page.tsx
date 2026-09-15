import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import {
  Badge,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  CardTitle,
  LiveIndicator,
  MetricBar,
  Prose,
  Section,
  StatusPill,
} from '@repo/ui';
import { getRiverBySlug, riverStatusLabel, rivers } from '@repo/data';
import { MapLegend, RiverMap } from '@repo/gis-map';
import type { BadgeTone, River } from '@repo/ui';

/** Params segmen dinamis untuk rute dossier sungai. */
export interface RiverDossierPageProps {
  params: { slug: string };
}

/** Nada Badge untuk tiap parameter yang dipantau — mengikuti makna ambangnya. */
const METRIC_TONE: Record<'alert' | 'watch' | 'measured', BadgeTone> = {
  alert: 'danger',
  watch: 'warning',
  measured: 'primary',
};

/** Warna garis luar kartu telemetri mengikuti tingkat keparahan status sungai. */
const STATUS_OUTLINE: Record<River['status'], string> = {
  good: 'border-status-good/35',
  warning: 'border-status-warning/45',
  critical: 'border-status-critical/50',
};

/** Tanggal pemantauan terakhir, dirangkai dalam Bahasa Indonesia. */
function formatTanggalIndonesia(iso: string): string {
  const parsed = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return iso;

  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(parsed);
}

/** Angka desimal dengan koma Indonesia, mis. 7.1 → "7,1". */
function angkaIndonesia(value: number): string {
  return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 }).format(value);
}

/** Inisial singkat nama pos pantau, mis. "Pos Pantau Citarum Hilir" → "PCH". */
function inisialVerifier(verifier: string): string {
  const initials = verifier
    .split(' ')
    .filter((word) => word.length > 0 && word.toLowerCase() !== 'pos' && word.toLowerCase() !== 'pantau')
    .map((word) => word.charAt(0).toUpperCase())
    .join('');

  return initials.length > 0 ? initials.slice(0, 3) : 'PP';
}

/**
 * Metrik terukur untuk satu air sungai: pH, oksigen terlarut, total padatan
 * tersuspensi, dan indeks sampah — dilengkapi ambang yang mudah dibaca.
 */
interface MetrikTerukur {
  label: string;
  value: number | string;
  unit?: string;
  min: number;
  max: number;
  safeRange: [number, number];
  tone: BadgeTone;
  hint: string;
}

function metrikSungai(river: River): MetrikTerukur[] {
  return [
    {
      label: 'pH',
      value: river.ph,
      unit: undefined,
      min: 0,
      max: 14,
      safeRange: [6.5, 8.5] as [number, number],
      tone: river.ph >= 6.5 && river.ph <= 8.5 ? METRIC_TONE.measured : METRIC_TONE.watch,
      hint: 'Baku mutu 6,5–8,5',
    },
    {
      label: 'Oksigen Terlarut (DO)',
      value: river.doMgL,
      unit: 'mg/L',
      min: 0,
      max: 10,
      safeRange: [5, 10] as [number, number],
      tone: river.doMgL >= 5 ? METRIC_TONE.measured : river.doMgL >= 3 ? METRIC_TONE.watch : METRIC_TONE.alert,
      hint: 'Minimal 5 mg/L untuk biota',
    },
    {
      label: 'Total Padatan Tersuspensi (TSS)',
      value: river.tssMgL,
      unit: 'mg/L',
      min: 0,
      max: 350,
      safeRange: [0, 100] as [number, number],
      tone: river.tssMgL <= 100 ? METRIC_TONE.measured : river.tssMgL <= 200 ? METRIC_TONE.watch : METRIC_TONE.alert,
      hint: 'Maksimal 100 mg/L',
    },
    {
      label: 'Indeks Sampah',
      value: river.wasteIndex,
      unit: undefined,
      min: 0,
      max: 3,
      safeRange: [0, 1] as [number, number],
      tone:
        river.wasteIndex === 'Rendah'
          ? METRIC_TONE.measured
          : river.wasteIndex === 'Sedang'
            ? METRIC_TONE.watch
            : METRIC_TONE.alert,
      hint: 'Rendah → Sedang → Berat',
    },
  ];
}

/** Tiga agenda lapangan terdekat untuk tiap daerah aliran sungai yang dipantau. */
function agendaLapangan(river: River) {
  return [
    {
      tanggal: '12 Okt 2026',
      jadwal: 'Pagi',
      title: `Uji air partisipatif di segmen hulu ${river.name}`,
      detail:
        'Relawan mengambil sampel di lima titik, mengukur pH dan oksigen terlarut bersama tim laboratorium keliling, lalu mengunggah hasilnya ke peta terbuka.',
    },
    {
      tanggal: '19 Okt 2026',
      jadwal: 'Sepanjang hari',
      title: 'Aksi bersih sampah tepian dan penghitungan timbulan',
      detail:
        'Pemilahan sampah domestik per jenis, pencatatan berat, dan pemetaan titik akumulasi sampah yang paling sering berulang di bantaran.',
    },
    {
      tanggal: '2 Nov 2026',
      jadwal: 'Sore',
      title: `Sekolah sungai bersama warga ${river.province}`,
      detail:
        'Kelas terbuka mengenai baku mutu air, indikator biologi sederhana, serta kanal pelaporan cepat bila warga menemukan buangan mencurigakan.',
    },
  ];
}

/** Tujuh dossier sungai dirender saat build supaya halaman terkirim statis. */
export function generateStaticParams() {
  return rivers.map((river) => ({ slug: river.slug }));
}

/**
 * Slug di luar tujuh sungai yang dipantau harus menjadi 404 sungguhan.
 *
 * Tanpa ini Next.js tetap merender slug tak dikenal saat permintaan datang;
 * `notFound()` memang menampilkan halaman 404, tetapi responsnya tetap
 * berstatus 200 dan di-cache lama oleh CDN — sehingga mesin pencari mengindeks
 * halaman "tidak ditemukan" sebagai konten yang sah.
 */
export const dynamicParams = false;

/** Judul dan deskripsi metadata disusun dari data sungai yang bersangkutan. */
export function generateMetadata({ params }: RiverDossierPageProps): Metadata {
  const river = getRiverBySlug(params.slug);

  if (!river) {
    return {
      title: 'Sungai tidak ditemukan — Jagatirta',
      description: 'Data sungai yang Anda cari belum tersedia di pangkalan data Jagatirta.',
    };
  }

  return {
    title: `Sungai ${river.name} — Dossier Pemantauan | Jagatirta`,
    description: `${river.description} Status ${riverStatusLabel[river.status]}, indeks kualitas air ${river.ikaScore}, diperbarui ${river.lastUpdated} oleh ${river.verifier}.`,
  };
}

/**
 * Dossier satu sungai: narasi editorial di bagian atas, telemetri operasional
 * di tengah, lalu aksi lapangan dan sebaran koordinat di bagian bawah.
 */
export default function Page({ params }: RiverDossierPageProps) {
  const river = getRiverBySlug(params.slug);

  if (!river) {
    notFound();
  }

  const statusText = riverStatusLabel[river.status];
  const metrics = metrikSungai(river);
  const agenda = agendaLapangan(river);
  const tanggalTerakhir = formatTanggalIndonesia(river.lastUpdated);
  const warnaZona = STATUS_OUTLINE[river.status];

  return (
    <main id="konten" className="bg-canvas">
      {/* 1 — Hero band: nama sungai pada skala display, provinsi, status. */}
      <section className="relative isolate flex min-h-[70svh] flex-col justify-end overflow-hidden bg-brand-deep text-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/images/${river.slug}.jpg`}
          alt={`Lanskap perairan Sungai ${river.name}`}
          width={1600}
          height={900}
          decoding="async"
          className="absolute inset-0 -z-20 h-full w-full object-cover"
        />
        <span
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-gradient-to-t from-brand-deep via-brand-deep/70 to-brand-deep/20"
        />

        <div className="mx-auto w-full max-w-7xl px-5 pb-14 pt-28 sm:px-8 md:pb-20 md:pt-36">
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/85">
              <li>
                <a href="/lokasi" className="rounded-sm underline-offset-4 transition-colors duration-200 ease-crisp hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                  Lokasi
                </a>
              </li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="text-white">
                Sungai {river.name}
              </li>
            </ol>
          </nav>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <StatusPill status={river.status} size="md" detail={`IKA ${river.ikaScore}`} />
            {river.liveCamUrl ? (
              <LiveIndicator tone="live" size="md" label="Kamera air tayang" className="bg-white/10" />
            ) : null}
          </div>

          <p className="mt-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-brand-accent">
            <span aria-hidden="true" className="h-px w-8 shrink-0 bg-brand-accent opacity-70" />
            {river.province}
          </p>

          <h1 className="text-display mt-4 max-w-4xl font-display font-bold text-balance text-white">
            Sungai {river.name}
          </h1>

          <p className="measure-editorial mt-6 text-base leading-relaxed text-white/80 md:text-lg">
            {river.description}
          </p>
        </div>
      </section>

      {/* 2 — Panel telemetri: status, IKA, dan parameter terukur. */}
      <Section
        id="telemetri"
        eyebrow="Telemetri"
        title={`Kualitas air Sungai ${river.name}`}
        description={`Pembacaan berkala dari ${river.verifier}. Angka-angka ini menjadi dasar setiap rekomendasi lapangan yang kami terbitkan.`}
      >
        <div className={`overflow-hidden rounded-2xl border ${warnaZona} bg-surface shadow-sm`}>
          <div className="grid gap-8 p-5 sm:p-6 md:p-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.6fr)] lg:gap-12">
            {/* Blok ringkasan: status, IKA, dan jejak verifikasi. */}
            <div className="flex flex-col gap-6">
              <div className="flex flex-wrap items-center gap-3">
                <StatusPill status={river.status} size="md" detail={statusText} />
                {river.liveCamUrl ? (
                  <LiveIndicator tone="live" size="sm" label="Pantauan langsung" />
                ) : null}
              </div>

              <div className="flex items-baseline gap-3">
                <span className="font-display text-[4.5rem] font-bold leading-[0.85] tracking-tight text-brand-deep tabular-nums md:text-[5.5rem]">
                  {river.ikaScore}
                </span>
                <span className="flex flex-col text-xs font-semibold uppercase tracking-[0.16em] text-ink-secondary">
                  <span>Indeks</span>
                  <span>Kualitas Air</span>
                </span>
              </div>

              <dl className="grid gap-4 border-t border-editorial pt-6 text-sm">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-secondary">
                    Verifikator
                  </dt>
                  <dd className="mt-1.5 flex items-center gap-2.5 font-medium text-ink">
                    <span
                      aria-hidden="true"
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-soft font-mono text-xs font-semibold text-brand-deep"
                    >
                      {inisialVerifier(river.verifier)}
                    </span>
                    {river.verifier}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-secondary">
                    Pembaruan terakhir
                  </dt>
                  <dd className="mt-1.5">
                    <time dateTime={river.lastUpdated} className="font-mono text-sm text-ink">
                      {tanggalTerakhir}
                    </time>
                  </dd>
                </div>
              </dl>
            </div>

            {/* Blok metrik: empat bar parameter kualitas air. */}
            <div className="flex flex-col gap-8 md:gap-9">
              {metrics.map((metric) => (
                <div key={metric.label}>
                  <div className="mb-2.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-2">
                    <h3 className="text-sm font-semibold uppercase leading-tight tracking-[0.1em] text-ink">
                      {metric.label}
                    </h3>
                    <Badge tone={metric.tone}>{statusText}</Badge>
                  </div>

                  {typeof metric.value === 'number' ? (
                    <MetricBar
                      label={metric.label}
                      value={metric.value}
                      min={metric.min}
                      max={metric.max}
                      unit={metric.unit}
                      safeRange={metric.safeRange}
                      status={river.status}
                      hint={metric.hint}
                      hideHeader
                    />
                  ) : (
                    <div className="mt-1 flex flex-wrap items-center gap-3">
                      <span className="font-display text-3xl font-bold leading-none text-brand-deep">
                        {metric.value}
                      </span>
                      <span className="text-xs text-ink-secondary">{metric.hint}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <p className="border-t border-editorial bg-canvas px-5 py-4 text-xs leading-relaxed text-ink-secondary sm:px-6 md:px-8">
            Pembaruan terakhir {tanggalTerakhir} · Diverifikasi {river.verifier} · Metodologi indeks
            menggabungkan parameter fisika-kimia air dengan pengamatan indeks sampah permukaan.
          </p>
        </div>
      </Section>

      {/* 3 — Isu utama dan 5 — Aksi lapangan. */}
      <Section
        id="aksi"
        eyebrow="Lapangan"
        title="Isu utama dan rencana aksi"
        description="Setiap pemantauan kami akhiri dengan komitmen lapangan yang bisa Anda ikuti secara langsung."
      >
        <div className="grid gap-grid-normal lg:grid-cols-2 lg:gap-grid-normal">
          <Card className="flex h-full flex-col">
            <CardHeader divider action={<Badge tone="neutral">{river.issues.length} isu</Badge>}>
              <CardTitle as="h3">Isu utama</CardTitle>
              <p className="text-sm leading-relaxed text-ink-secondary">
                Prioritas pengawasan di DAS {river.name} pada periode ini.
              </p>
            </CardHeader>
            <CardBody className="flex flex-wrap gap-2.5 gap-y-3">
              {river.issues.map((issue) => (
                <Badge key={issue} tone="primary" dot>
                  {issue}
                </Badge>
              ))}
            </CardBody>
            <CardFooter divider className="text-xs text-ink-secondary">
              Status {statusText} · IKA {river.ikaScore}/100
            </CardFooter>
          </Card>

          <Card className="flex h-full flex-col">
            <CardHeader divider>
              <CardTitle as="h3">Aksi di lapangan</CardTitle>
              <p className="text-sm leading-relaxed text-ink-secondary">
                Tiga agenda terdekat yang terbuka untuk relawan baru.
              </p>
            </CardHeader>
            <CardBody className="flex flex-col gap-0 p-0 sm:p-0">
              <ul className="flex flex-col divide-y divide-editorial">
                {agenda.map((item) => (
                  <li key={item.title} className="flex gap-4 px-5 py-5 sm:px-6">
                    <time className="flex w-16 shrink-0 flex-col text-xs font-semibold uppercase leading-tight tracking-[0.08em] text-brand-primary">
                      <span>{item.tanggal}</span>
                      <span className="mt-1 font-medium tracking-normal text-ink-secondary">
                        {item.jadwal}
                      </span>
                    </time>
                    <div className="min-w-0">
                      <h4 className="font-display text-base font-semibold leading-snug text-ink">
                        {item.title}
                      </h4>
                      <p className="mt-1.5 text-sm leading-relaxed text-ink-secondary">
                        {item.detail}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardBody>
            <CardFooter divider className="flex-wrap gap-3">
              <Button href="/volunteer" variant="primary" size="sm">
                Jadi relawan
              </Button>
              <Button href="/lapor" variant="outline" size="sm">
                Laporkan pencemaran
              </Button>
            </CardFooter>
          </Card>
        </div>
      </Section>

      {/* 4 — Narasi editorial: konteks DAS, tekanan, dan harapan pemulihan. */}
      <Section
        id="narasi"
        eyebrow="Catatan lapangan"
        title={`Membaca ${river.name} dari hulu ke hilir`}
        tone="dark"
      >
        <Prose as="article" size="lead" width="editorial" dropCap className="text-white/80">
          <p>
            {river.name} adalah salah satu dari tujuh daerah aliran sungai yang kami pantau secara
            berkala di {river.province}. Panjang alirannya melewati berbagai lanskap — dari lereng
            berhutan di bagian hulu, kawasan pertanian dan permukiman di tengah, hingga muara yang
            sibuk di hilir — sehingga persoalan yang muncul di setiap segmen pun berbeda. Tim
            pemantau {river.verifier} mencatat bahwa tekanan terhadap sungai ini bergerak seiring
            perubahan tata guna lahan di sepanjang alirannya. Pada pembaruan {tanggalTerakhir},
            indeks kualitas air {river.name} berada di angka {river.ikaScore} dengan status{' '}
            <strong className="text-white">{statusText}</strong>.
          </p>
          <p>
            Tekanan paling terasa datang dari <em>{river.issues[0].toLowerCase()}</em>, disusul{' '}
            <em>{river.issues[1].toLowerCase()}</em> dan <em>{river.issues[2].toLowerCase()}</em>.
            Ketiganya saling menguatkan: ketika tutupan lahan di hulu berkurang, sedimen yang
            terbawa ke hilir meningkat, dan daya dukung sungai untuk menetralkan buangan pun
            menurun. Angka yang kami himpun memperlihatkan pola itu — pH terukur{' '}
            {angkaIndonesia(river.ph)}, oksigen terlarut {angkaIndonesia(river.doMgL)} mg/L, dan
            total padatan tersuspensi {angkaIndonesia(river.tssMgL)} mg/L, dengan indeks sampah
            permukaan pada kategori {river.wasteIndex.toLowerCase()}.
          </p>
          <p>
            Karena itu, kerja pemulihan di {river.province} tidak boleh berhenti pada satu titik
            pengambilan sampel. Kami menggabungkan pemantauan rutin, advokasi data terbuka, dan
            pendidikan warga bantaran supaya warga punya alat untuk menguji serta menuntut haknya
            atas air bersih. Dossier ini diperbarui setiap kali ada pembacaan baru, dan setiap
            temuan dapat dilaporkan langsung lewat kanal pengaduan kami — sebab sungai yang terawat
            selalu bermula dari orang-orang yang mengenalnya baik.
          </p>
        </Prose>
      </Section>

      {/* 6 — Peta: hanya menampilkan satu sungai, dari array berisi satu objek. */}
      <Section
        id="peta"
        eyebrow="Koordinat"
        title={`Titik pantau ${river.name}`}
        description={`Lokasi acuan pemantauan berada di ${river.coordinates.lat.toFixed(4)}, ${river.coordinates.lng.toFixed(4)}.`}
      >
        <div className="flex flex-col gap-4">
          <RiverMap rivers={[river]} height="380px" selectedSlug={river.slug} />
          <div className="flex flex-wrap items-center justify-between gap-4">
            <MapLegend />
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-ink-secondary">
              {river.coordinates.lat.toFixed(4)}, {river.coordinates.lng.toFixed(4)}
            </p>
          </div>
        </div>
      </Section>
    </main>
  );
}
