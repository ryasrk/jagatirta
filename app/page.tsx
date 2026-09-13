import type { Metadata } from 'next';
import Link from 'next/link';
import {
  BookOpen,
  FlaskConical,
  Trees,
  Trash2,
  ArrowRight,
  Compass,
  type LucideIcon,
} from 'lucide-react';

import {
  Button,
  CampaignCard,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  CardTitle,
  LiveIndicator,
  Section,
  StatCounter,
  StatusPill,
} from '@repo/ui';
import { campaigns, jagatirtaPrograms, rivers } from '@repo/data';
import { MapLegend } from '@repo/gis-map';

export const metadata: Metadata = {
  title: 'Jagatirta — Menjaga Tujuh Urat Nadi Sungai Indonesia',
  description:
    'Jagatirta memantau tujuh daerah aliran sungai besar Indonesia melalui sains warga: data kualitas air yang terbuka, terverifikasi, dan dapat ditindaklanjuti siapa saja.',
};

/* -------------------------------------------------------------------------- */
/*  Data tampilan — diturunkan dari paket bersama, bukan disalin manual        */
/* -------------------------------------------------------------------------- */

/** Statistik dampak yang berhitung naik saat masuk viewport. */
const IMPACT_STATS: { value: number; label: string; suffix?: string }[] = [
  { value: 7, label: 'Sungai Dipantau' },
  { value: 342, label: 'Relawan Aktif' },
  { value: 12480, label: 'Kali Dibaca' },
  { value: 1200, label: 'Kilogram Sampah Tertangkap', suffix: 'kg' },
];

/**
 * Program dari data bersama membawa `icon` sebagai nama ikon. Lookup ini
 * memetakannya ke komponen lucide tanpa `any` dan tanpa ikon yang tidak dipakai.
 */
const PROGRAM_ICONS: Record<string, LucideIcon> = {
  FlaskConical,
  Trash2,
  BookOpen,
  Trees,
};

/** Kampanye penggalangan dana yang ditampilkan di beranda. */
const featuredCampaign = campaigns.find((campaign) => campaign.type === 'dana');

/* -------------------------------------------------------------------------- */
/*  Kartu sungai — digunakan di kisi "Tujuh sungai, satu peta"                 */
/* -------------------------------------------------------------------------- */

function RiverCard({ river }: { river: (typeof rivers)[number] }) {
  return (
    <Card
      interactive
      href={`/lokasi/${river.slug}`}
      aria-label={`Buka peta dan data mutu air Sungai ${river.name}`}
      className="animate-fade-up motion-reduce:animate-none"
    >
      <CardHeader action={<StatusPill status={river.status} />}>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-primary">
          {river.province}
        </p>
        <CardTitle as="h3">Sungai {river.name}</CardTitle>
      </CardHeader>

      <CardBody className="flex flex-col gap-3">
        <p className="line-clamp-3 leading-relaxed">{river.description}</p>
      </CardBody>

      <CardFooter divider className="justify-between gap-4">
        <span className="flex items-baseline gap-2">
          <span className="font-display text-2xl font-bold leading-none tracking-tight text-brand-deep">
            {river.ikaScore}
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-secondary">
            Indeks IKA
          </span>
        </span>
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-primary">
          Lihat peta
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </span>
      </CardFooter>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*  Halaman beranda                                                            */
/* -------------------------------------------------------------------------- */

export default function BerandaJagatirta() {
  return (
    <main>
      {/* ------------------------------------------------------------------ */}
      {/* 1. HERO full-bleed                                                  */}
      {/* ------------------------------------------------------------------ */}
      <section className="relative isolate flex min-h-[92svh] items-end overflow-hidden bg-river-navy text-white">
        {/* Latar gambar absolut: `object-cover` dengan tinggi penuh pembungkus,
            jadi tidak ada ruang kosong maupun pergeseran tata letak saat memuat. */}
        <img
          src="/images/hero-banner.jpg"
          alt="Relawan memantau kualitas air sungai dari tepi bantaran saat matahari terbit"
          width={1920}
          height={1280}
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 -z-20 h-full w-full object-cover object-center"
        />
        {/* Lapisan gelap dua arah: gelap di bawah tempat teks, lebih ringan di atas
            agar foto tetap terbaca sebagai foto, bukan blok warna. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-gradient-to-t from-river-navy via-river-navy/85 to-river-navy/45"
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 -z-10 h-40 bg-gradient-to-b from-river-navy/90 to-transparent"
        />

        <div className="mx-auto w-full max-w-7xl px-5 pb-16 pt-28 sm:px-8 md:pb-24 md:pt-36">
          <div className="animate-fade-up">
            <LiveIndicator tone="live" label="Pemantauan aktif" size="md" />
          </div>

          <h1 className="text-display mt-6 max-w-4xl text-balance font-display font-bold text-white">
            Menjaga Tujuh Urat Nadi Sungai Indonesia
          </h1>

          <p className="measure-editorial mt-6 text-base leading-relaxed text-white/85 sm:text-lg">
            Dari Cisadane hingga Mahakam, ribuan warga mengukur pH, oksigen terlarut, dan
            kekeruhan air sungai mereka sendiri. Datanya terbuka, terverifikasi, dan bisa
            dipakai siapa saja untuk menuntut sungai yang lebih bersih.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button href="/volunteer" variant="primary" size="lg" className="w-full sm:w-auto">
              Jadi Water Ranger
            </Button>
            <Button
              href="/lokasi"
              variant="secondary"
              size="lg"
              className="w-full bg-white/10 text-white backdrop-blur-sm hover:bg-white hover:text-brand-deep sm:w-auto"
            >
              Lihat Peta Sungai
            </Button>
          </div>

          <dl className="mt-12 grid max-w-3xl grid-cols-2 gap-x-6 gap-y-5 border-t border-white/15 pt-8 sm:grid-cols-3">
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-accent">
                Cakupan
              </dt>
              <dd className="mt-1.5 text-sm leading-snug text-white/80">
                7 daerah aliran sungai di 5 pulau
              </dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-accent">
                Metode
              </dt>
              <dd className="mt-1.5 text-sm leading-snug text-white/80">
                Sains warga terverifikasi pos pantau
              </dd>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-accent">
                Akses data
              </dt>
              <dd className="mt-1.5 text-sm leading-snug text-white/80">
                Terbuka penuh, tanpa biaya
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 2. Pita statistik dampak                                            */}
      {/* ------------------------------------------------------------------ */}
      <section
        aria-label="Statistik dampak Jagatirta"
        className="relative isolate overflow-hidden bg-brand-deep px-5 py-16 text-white sm:px-8 md:py-24"
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 top-1/2 -z-10 h-80 w-80 -translate-y-1/2 rounded-full bg-brand-primary opacity-25 blur-3xl"
        />
        <div className="mx-auto max-w-7xl">
          <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-brand-accent">
            <span aria-hidden="true" className="h-px w-8 bg-brand-accent opacity-70" />
            Dampak terukur
          </p>

          <dl className="mt-8 grid grid-cols-1 gap-x-8 gap-y-10 border-t border-white/15 pt-10 sm:grid-cols-2 lg:grid-cols-4">
            {IMPACT_STATS.map((stat) => (
              <div key={stat.label} className="border-l border-white/15 pl-5">
                <StatCounter
                  value={stat.value}
                  label={stat.label}
                  suffix={stat.suffix}
                  className="[&>p:last-child]:text-white/75"
                />
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 3. Cuplikan tujuh sungai                                           */}
      {/* ------------------------------------------------------------------ */}
      <Section
        id="sungai"
        eyebrow="Wilayah Sungai"
        title="Tujuh sungai, satu peta"
        description="Setiap sungai punya cerita, tekanan, dan penanggung jawabnya sendiri. Skor Indeks Kualitas Air (IKA) diperbarui dari pengukuran lapangan relawan dan diverifikasi oleh pos pantau setempat."
        className="py-20 md:py-28"
      >
        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rivers.map((river) => (
            <li key={river.id} className="flex">
              <RiverCard river={river} />
            </li>
          ))}

          {/* Kartu penutup: mengubah kisi 7 kartu menjadi ajakan, bukan baris kosong. */}
          <li className="flex">
            <Card
              interactive
              href="/lokasi"
              className="justify-between bg-canvas before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-gradient-to-r before:from-brand-primary before:to-brand-accent before:content-['']"
            >
              <CardHeader>
                <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-primary">
                  <Compass aria-hidden="true" className="h-4 w-4" />
                  Peta interaktif
                </span>
                <CardTitle as="h3">Empat puluh lebih titik pantau menanti di peta</CardTitle>
              </CardHeader>
              <CardBody>
                <p className="measure-editorial leading-relaxed">
                  Lihat sebaran pos pantau, nilai pH dan oksigen terlarut terbaru, serta laporan
                  warga di sepanjang aliran — semuanya dalam satu layar.
                </p>
              </CardBody>
              <CardFooter divider>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-primary">
                  Buka peta sungai
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </span>
              </CardFooter>
            </Card>
          </li>
        </ul>

        <div className="mt-10 flex flex-col gap-4 rounded-2xl border border-editorial bg-surface px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold text-ink">Arti warna pada peta</p>
            <MapLegend />
          </div>
          <Link
            href="/lokasi"
            className="inline-flex min-h-[48px] items-center gap-1.5 self-start rounded-xl px-2 text-sm font-semibold text-brand-primary transition-colors duration-200 ease-crisp hover:text-brand-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
          >
            Jelajahi semua titik pantau
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
      </Section>

      {/* ------------------------------------------------------------------ */}
      {/* 4. Cuplikan program                                                 */}
      {/* ------------------------------------------------------------------ */}
      <Section
        id="program"
        tone="dark"
        eyebrow="Program"
        title="Empat cara kami menjaga sungai"
        description="Tidak ada satu solusi tunggal untuk sungai yang tercemar. Yang kami kerjakan berlapis: mengukur, membersihkan, mengedukasi, lalu memulihkan."
        className="py-20 md:py-28"
      >
        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {jagatirtaPrograms.map((program) => {
            const Icon = PROGRAM_ICONS[program.icon];

            return (
              <li key={program.id} className="flex">
                <Card
                  interactive
                  href="/program"
                  aria-label={`Lihat program ${program.title}`}
                  className="border-white/10 bg-white/[0.06] text-white backdrop-blur-sm hover:border-brand-accent"
                >
                  <CardHeader>
                    <span
                      aria-hidden="true"
                      className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-accent/15 text-brand-accent ring-1 ring-inset ring-brand-accent/30"
                    >
                      {Icon ? <Icon className="h-6 w-6" /> : null}
                    </span>
                    <CardTitle as="h3" className="mt-2 text-white">
                      {program.title}
                    </CardTitle>
                  </CardHeader>
                  <CardBody className="text-white/75">
                    <p className="leading-relaxed">{program.description}</p>
                  </CardBody>
                </Card>
              </li>
            );
          })}
        </ul>

        <div className="mt-10">
          <Button
            href="/program"
            variant="secondary"
            size="lg"
            className="w-full bg-white text-brand-deep hover:bg-brand-accent hover:text-brand-deep sm:w-auto"
          >
            Lihat seluruh program
          </Button>
        </div>
      </Section>

      {/* ------------------------------------------------------------------ */}
      {/* 5. Kampanye aktif                                                   */}
      {/* ------------------------------------------------------------------ */}
      {featuredCampaign ? (
        <Section
          id="kampanye"
          eyebrow="Kampanye Aktif"
          title="Tiga perangkap sampah untuk Cisadane"
          className="py-20 md:py-28"
        >
          <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-14">
            <div className="flex flex-col gap-6">
              <span
                aria-hidden="true"
                className="h-[3px] w-16 rounded-full bg-brand-accent"
              />
              <p className="text-lg leading-relaxed text-ink md:text-xl">
                Setiap musim hujan, Cisadane mengalirkan sampah plastik dari hulu ke pesisir
                Tangerang — melewati permukiman yang tidak pernah menghasilkan sampah itu.
              </p>
              <p className="measure-editorial leading-relaxed text-ink-secondary">
                Perangkap sampah apung terbukti bekerja: dua pekan pertama di satu titik sudah
                menahan lebih dari satu ton kemasan dan botol sekali pakai. Dengan dukungan Anda,
                kami memasang perangkap yang sama di tiga titik strategis, melatih tim patroli
                warga, dan memasang jadwal pengangkutan yang bisa dipertanggungjawabkan.
              </p>

              <dl className="grid grid-cols-2 gap-x-6 gap-y-5 border-t border-editorial pt-6 sm:grid-cols-3">
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-primary">
                    Titik pasang
                  </dt>
                  <dd className="mt-1.5 font-display text-2xl font-bold leading-none text-brand-deep">
                    3
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-primary">
                    Panjang terjaga
                  </dt>
                  <dd className="mt-1.5 font-display text-2xl font-bold leading-none text-brand-deep">
                    18 km
                  </dd>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-primary">
                    Warga terlayani
                  </dt>
                  <dd className="mt-1.5 font-display text-2xl font-bold leading-none text-brand-deep">
                    24.000
                  </dd>
                </div>
              </dl>
            </div>

            <CampaignCard
              title={featuredCampaign.title}
              description={featuredCampaign.description}
              target={featuredCampaign.target}
              raised={featuredCampaign.raised}
              type={featuredCampaign.type}
              href={`/kampanye/${featuredCampaign.slug}`}
            />
          </div>
        </Section>
      ) : null}

      {/* ------------------------------------------------------------------ */}
      {/* 6. Pita ajakan penutup                                              */}
      {/* ------------------------------------------------------------------ */}
      <section
        aria-labelledby="ajakan-penutup"
        className="relative isolate overflow-hidden bg-brand-deep px-5 py-20 text-white sm:px-8 md:py-28"
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 bottom-0 -z-10 h-72 w-72 rounded-full bg-brand-primary opacity-25 blur-3xl"
        />
        <div className="mx-auto flex max-w-4xl flex-col items-start">
          <span aria-hidden="true" className="h-[3px] w-16 rounded-full bg-brand-accent" />
          <h2
            id="ajakan-penutup"
            className="text-display mt-6 text-balance font-display font-bold text-white"
          >
            Sungaimu butuh kamu.
          </h2>
          <p className="measure-editorial mt-5 text-base leading-relaxed text-white/80 md:text-lg">
            Satu jam mengukur air hari ini, atau satu laporan dari tepi sungai tempatmu tinggal,
            cukup untuk mengubah apa yang bisa dilihat semua orang. Tidak perlu jadi ahli — kami
            akan melatihnya.
          </p>

          <div className="mt-9 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <Button href="/volunteer" variant="primary" size="lg" className="w-full sm:w-auto">
              Daftar jadi Water Ranger
            </Button>
            <Button
              href="/lapor"
              variant="secondary"
              size="lg"
              className="w-full bg-white/10 text-white backdrop-blur-sm hover:bg-white hover:text-brand-deep sm:w-auto"
            >
              Laporkan pencemaran
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
