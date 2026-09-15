import type { Metadata } from 'next';
import {
  BookOpen,
  Droplets,
  FlaskConical,
  Leaf,
  type LucideIcon,
  ShieldCheck,
  Trash2,
  Trees,
  Users,
} from 'lucide-react';

import { Button, Figure, Section } from '@repo/ui';
import { jagatirtaPrograms } from '@repo/data';
import type { Program } from '@repo/ui/types';

export const metadata: Metadata = {
  title: 'Program — Jagatirta River Watch Indonesia',
  description:
    'Empat pilar kerja Jagatirta: sains warga, pembersihan sungai, edukasi bantaran, dan restorasi sempadan di tujuh daerah aliran sungai Indonesia.',
};

/* -------------------------------------------------------------------------- */
/*  Konten program                                                            */
/* -------------------------------------------------------------------------- */

interface ProgramDetail {
  /** Ikon Lucide yang merepresentasikan pilar kerja. */
  icon: LucideIcon;
  /** Kicker kecil di atas judul — memberi konteks tanpa mengulang judul. */
  kicker: string;
  /** Path gambar publik (wajib ada di folder public/images). */
  image: string;
  /** Teks alternatif yang deskriptif untuk pembaca layar. */
  imageAlt: string;
  /** Tiga kegiatan konkret, ditulis sebagai kalimat utuh. */
  activities: readonly string[];
}

/**
 * Peta detail per slug program. Dipisahkan dari data agar `jagatirtaPrograms`
 * tetap menjadi sumber tunggal judul + deskripsi, sementara lapisan penyajian
 * (ikon, gambar, kegiatan) tetap bisa dibaca sebagai satu tabel di mata editor.
 */
const PROGRAM_DETAIL: Record<string, ProgramDetail> = {
  'river-patrol': {
    icon: FlaskConical,
    kicker: 'Pilar 01 — Sains Warga',
    image: '/images/water-testing.jpg',
    imageAlt:
      'Relawan Jagatirta mengukur kualitas air sungai dengan tabung uji dan alat ukur digital di tepi sungai.',
    activities: [
      'Pelatihan uji pH dan DO untuk warga bantaran',
      'Pemasangan alat ukur kekeruhan di 40 titik pantau',
      'Pelaporan mingguan hasil uji ke dashboard sungai terbuka',
    ],
  },
  'river-cleanup': {
    icon: Trash2,
    kicker: 'Pilar 02 — Aksi Lapangan',
    image: '/images/cleanup-campaign.jpg',
    imageAlt:
      'Puluhan relawan memilah sampah plastik hasil pembersihan sungai di tepi bantaran.',
    activities: [
      'Kerja bakti sungai berjadwal setiap Sabtu pertama',
      'Pemasangan perangkap sampah apung di tiga muara strategis',
      'Pencatatan volume sampah plastik yang berhasil ditahan per titik',
    ],
  },
  'edukasi-bantaran': {
    icon: BookOpen,
    kicker: 'Pilar 03 — Pendidikan',
    image: '/images/brantas.jpg',
    imageAlt:
      'Aliran Sungai Brantas yang mengalir tenang dengan permukiman warga di sepanjang bantarannya.',
    activities: [
      'Sekolah Sungai mingguan untuk anak usia 7–12 tahun',
      'Modul belajar ekologi air yang dikembangkan bersama guru lokal',
      'Kelas pemetaan bantaran bagi kader remaja tiap kampung',
    ],
  },
  'restorasi-sempadan': {
    icon: Trees,
    kicker: 'Pilar 04 — Restorasi',
    image: '/images/hero-banner.jpg',
    imageAlt:
      'Hamparan sempadan sungai dengan vegetasi riparian yang rimbun dan air sungai yang mengalir jernih.',
    activities: [
      'Penanaman bambu dan vetiver di 12 kilometer sempadan kritis',
      'Pemetaan erosi tebing bersama pemerintah desa',
      'Perjanjian perawatan pohon selama tiga tahun bersama warga',
    ],
  },
};

/** Ikon cadangan bila slug tidak terdaftar di tabel detail. */
const FALLBACK_ICON: LucideIcon = Droplets;

/* -------------------------------------------------------------------------- */
/*  Bagian pendukung                                                          */
/* -------------------------------------------------------------------------- */

const engagementSteps = [
  {
    title: 'Kenali sungaimu',
    body: 'Mulai dengan membaca data pH, oksigen terlarut, dan indeks kualitas air di tujuh DAS yang kami pantau. Kenali titik terdekat dari tempatmu tinggal.',
  },
  {
    title: 'Ikut pelatihan',
    body: 'Ikuti lokakarya sains warga dua hari — belajar mengambil sampel, mengukur, dan mencatat temuan dengan protokol yang sama di seluruh jaringan.',
  },
  {
    title: 'Turun ke lapangan',
    body: 'Gabung patroli sungai, kerja bakti, atau sekolah bantaran bersama kader setempat. Satu shift tiga jam sudah mengubah data dan warga di sekitarmu.',
  },
] as const;

/* -------------------------------------------------------------------------- */
/*  Blok program — tata letak dua kolom bergantian                            */
/* -------------------------------------------------------------------------- */

interface ProgramRowProps {
  program: Program;
  detail: ProgramDetail;
  /** `true` pada baris ganjil: gambar berpindah ke kolom kiri. */
  reversed: boolean;
}

function ProgramRow({ program, detail, reversed }: ProgramRowProps) {
  const Icon = detail.icon;

  return (
    <article
      className="group grid items-center gap-grid-normal md:grid-cols-2 md:gap-grid-loose lg:gap-grid-loose"
      aria-labelledby={`program-${program.slug}`}
    >
      {/* Kolom teks */}
      <div
        className={
          reversed
            ? 'animate-fade-up md:order-2 md:pl-4'
            : 'animate-fade-up md:order-1 md:pr-4'
        }
      >
        <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-brand-primary">
          <Icon aria-hidden="true" focusable="false" className="h-4 w-4 shrink-0" />
          {detail.kicker}
        </p>

        <h3
          id={`program-${program.slug}`}
          className="mt-4 font-display text-2xl font-bold leading-tight tracking-tight text-ink sm:text-3xl"
        >
          {program.title}
        </h3>

        <p className="measure-editorial mt-4 text-base leading-relaxed text-ink-secondary md:text-lg">
          {program.description}
        </p>

        <ul className="mt-6 space-y-3">
          {detail.activities.map((activity) => (
            <li key={activity} className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-accent"
              />
              <span className="text-sm leading-relaxed text-ink md:text-base">
                {activity}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Kolom gambar */}
      <div
        className={reversed ? 'md:order-1' : 'md:order-2'}
        style={{ aspectRatio: '4 / 3' }}
      >
        <Figure
          src={detail.image}
          alt={detail.imageAlt}
          ratio="4:3"
          className="h-full"
          frameClassName="h-full"
        />
      </div>
    </article>
  );
}

/* -------------------------------------------------------------------------- */
/*  Halaman                                                                   */
/* -------------------------------------------------------------------------- */

export default function ProgramPage() {
  return (
    <main className="bg-canvas">
      {/* ── Hero halaman (kompak, bukan layar penuh) ───────────────────── */}
      <section className="relative isolate overflow-hidden bg-brand-deep px-5 py-section-compact text-white sm:px-8 md:py-section-normal">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-24 -z-10 h-64 w-64 rounded-full bg-brand-primary opacity-25 blur-3xl"
        />
        <div className="mx-auto max-w-7xl">
          <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-brand-accent">
            <span aria-hidden="true" className="h-px w-8 shrink-0 bg-brand-accent opacity-70" />
            Jagatirta River Watch
          </p>

          <h1 className="text-display measure-editorial mt-4 font-display font-bold text-white">
            Program
          </h1>

          <p className="measure-editorial mt-5 text-base leading-relaxed text-white/80 md:text-lg">
            Kami bekerja lewat empat pilar yang saling menopang: sains warga untuk membaca
            kondisi sungai, aksi lapangan untuk menahan sampah dan memulihkan aliran, edukasi
            bantaran untuk menumbuhkan kesadaran dari usia dini, dan restorasi sempadan untuk
            mengembalikan koridor ekologis yang menjaga sungai tetap hidup.
          </p>

          <dl className="mt-10 grid max-w-2xl grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4">
            {[
              { value: '4', label: 'Pilar kerja' },
              { value: '7', label: 'DAS dipantau' },
              { value: '1.200+', label: 'Kader warga' },
              { value: '40', label: 'Titik pantau' },
            ].map((stat) => (
              <div key={stat.label}>
                <dt className="sr-only">{stat.label}</dt>
                <dd>
                  <span className="block font-display text-3xl font-bold text-brand-accent sm:text-4xl">
                    {stat.value}
                  </span>
                  <span className="mt-1 block text-xs uppercase tracking-[0.14em] text-white/85">
                    {stat.label}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ── Empat pilar — tata letak dua kolom bergantian ──────────────── */}
      <Section
        eyebrow="Empat Pilar"
        title="Cara kami menjaga sungai"
        description="Setiap pilar punya ukuran keberhasilan sendiri, tetapi baru berdampak saat dijalankan bersamaan oleh warga yang tinggal di bantaran."
        id="pilar"
      >
        <div className="flex flex-col gap-20 md:gap-28">
          {jagatirtaPrograms.map((program, index) => {
            const detail: ProgramDetail = PROGRAM_DETAIL[program.slug] ?? {
              icon: ((): LucideIcon => {
                switch (program.icon) {
                  case 'Trash2':
                    return Trash2;
                  case 'BookOpen':
                    return BookOpen;
                  case 'Trees':
                    return Trees;
                  case 'FlaskConical':
                    return FlaskConical;
                  default:
                    return FALLBACK_ICON;
                }
              })(),
              kicker: `Pilar 0${index + 1}`,
              image: '/images/hero-banner.jpg',
              imageAlt: program.title,
              activities: [],
            };

            return (
              <ProgramRow
                key={program.id}
                program={program}
                detail={detail}
                reversed={index % 2 === 1}
              />
            );
          })}
        </div>
      </Section>

      {/* ── Cara terlibat ──────────────────────────────────────────────── */}
      <Section
        eyebrow="Bergabung"
        title="Bagaimana cara terlibat?"
        description="Tidak perlu latar belakang sains atau lingkungan. Yang kami butuhkan hanya waktu tiga jam dan kemauan untuk belajar dari sungai di dekat tempat tinggalmu."
        id="terlibat"
      >
        <ol className="grid gap-grid-normal md:grid-cols-3 md:gap-grid-loose">
          {engagementSteps.map((step, index) => (
            <li
              key={step.title}
              className="relative border-t-2 border-brand-primary pt-6 md:pl-0"
            >
              <span className="font-display text-sm font-bold tabular-nums text-brand-primary">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-3 text-xl font-semibold tracking-tight text-ink">
                {step.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-secondary md:text-base">
                {step.body}
              </p>
            </li>
          ))}
        </ol>

        <div className="mt-12 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <Button href="/volunteer" variant="primary" size="lg">
            Daftar jadi relawan
          </Button>
          <p className="flex items-center gap-2 text-sm text-ink-secondary">
            <Users aria-hidden="true" focusable="false" className="h-4 w-4 shrink-0 text-brand-primary" />
            Batch pelatihan berikutnya dibuka untuk 60 relawan baru.
          </p>
        </div>
      </Section>

      {/* ── Penutup — jaminan akuntabilitas ───────────────────────────── */}
      <section className="border-t border-editorial bg-surface-pure px-5 py-section-compact sm:px-8 md:py-section-normal">
        <div className="mx-auto grid max-w-7xl gap-grid-normal md:grid-cols-3 md:gap-grid-loose">
          {[
            {
              icon: ShieldCheck,
              title: 'Data terbuka',
              body: 'Semua hasil uji air dipublikasikan apa adanya, termasuk temuan yang belum menggembirakan.',
            },
            {
              icon: Leaf,
              title: 'Berbasis komunitas',
              body: 'Kader lokal memimpin setiap program; tim Jagatirta menyediakan protokol, alat, dan pendampingan.',
            },
            {
              icon: Droplets,
              title: 'Berlanjut',
              body: 'Setiap program dirancang hidup lebih dari lima tahun dengan perawatan oleh warga sendiri.',
            },
          ].map((item) => {
            const ItemIcon = item.icon;

            return (
              <div key={item.title}>
                <ItemIcon
                  aria-hidden="true"
                  focusable="false"
                  className="h-6 w-6 text-brand-primary"
                />
                <h2 className="mt-4 text-lg font-semibold tracking-tight text-ink">
                  {item.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-secondary">
                  {item.body}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
