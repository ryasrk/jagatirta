import type { Metadata } from 'next';

import { Badge, Card, CardBody, CardTitle, Figure, Section } from '@repo/ui';

import { VolunteerForm } from './volunteer-form';

export const metadata: Metadata = {
  title: 'Gabung Water Ranger — Jagatirta',
  description:
    'Daftar sebagai relawan Water Ranger Jagatirta: uji air, dokumentasi, logistik, edukasi, dan aksi lapangan untuk tujuh sungai besar Indonesia.',
};

/* -------------------------------------------------------------------------- */
/*  Konten statis                                                              */
/* -------------------------------------------------------------------------- */

interface Duty {
  readonly title: string;
  readonly detail: string;
}

const DUTIES: readonly Duty[] = [
  {
    title: 'Uji air di titik pantau',
    detail:
      'Mengukur pH, oksigen terlarut, dan kekeruhan di pos pantau yang ditetapkan, lalu mengunggah hasilnya dengan foto gelas ukur dan catatan waktu.',
  },
  {
    title: 'Dokumentasi kondisi sungai',
    detail:
      'Merekam perubahan bantaran, timbulan sampah, dan aktivitas pengerukan lewat foto serta video bersudut tetap agar perubahannya bisa dibandingkan bulan ke bulan.',
  },
  {
    title: 'Patroli dan pembersihan bersama',
    detail:
      'Ikut patroli rutin dua pekan sekali, memasang perangkap sampah apung, dan memilah temuan untuk dilaporkan kepada koordinator wilayah.',
  },
  {
    title: 'Edukasi warga dan sekolah bantaran',
    detail:
      'Mendampingi anak-anak dan warga sekitar mengenali ekologi sungai mereka sendiri, termasuk cara membaca hasil uji air secara sederhana.',
  },
];

interface Faq {
  readonly question: string;
  readonly answer: string;
}

const FAQS: readonly Faq[] = [
  {
    question: 'Apakah saya perlu pengalaman atau latar belakang sains?',
    answer:
      'Tidak. Semua relawan baru mengikuti orientasi lapangan selama satu hari dan pelatihan penggunaan alat uji air. Kami mengajarkan cara membaca pH, oksigen terlarut, dan kekeruhan dari nol.',
  },
  {
    question: 'Berapa banyak waktu yang harus saya siapkan?',
    answer:
      'Sekitar empat hingga enam jam per bulan. Umumnya satu kali kunjungan pos pantau dan satu kali kegiatan bersama warga. Jadwal disepakati per wilayah, jadi kamu bisa mulai dari komitmen paling ringan.',
  },
  {
    question: 'Apa yang harus saya bawa saat turun ke lapangan?',
    answer:
      'Sepatu yang menutup kaki, pakaian yang tidak keberatan kotor, topi, dan botol minum. Alat uji, rompi, sarung tangan, serta kotak P3K disediakan oleh koordinator di titik kumpul.',
  },
  {
    question: 'Apakah ada biaya pendaftaran atau iuran?',
    answer:
      'Tidak ada. Pendaftaran dan seluruh pelatihan gratis. Kami hanya meminta kesediaan waktu dan kedisiplinan melaporkan hasil, karena data relawan itulah yang menjadi dasar advokasi kami.',
  },
];

/* -------------------------------------------------------------------------- */
/*  Halaman                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Portal pendaftaran relawan Jagatirta — permukaan Operate yang utama.
 *
 * Halaman ini tetap Server Component: hero, daftar tugas, dan FAQ dirender di
 * server sehingga teks langsung terbaca walau jaringan lapangan lambat. Hanya
 * formulirnya yang menjadi client component (`VolunteerForm`), karena di
 * situlah state dan validasi benar-benar dibutuhkan.
 */
export default function VolunteerPage() {
  return (
    <main>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <Section
        tone="dark"
        className="pb-20 pt-14 md:pb-28 md:pt-20"
        aria-labelledby="daftar-relawan-judul"
      >
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-16">
          <div className="animate-fade-up">
            <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-brand-accent">
              <span aria-hidden="true" className="h-px w-8 shrink-0 bg-brand-accent opacity-70" />
              Rekrutmen Water Ranger
            </p>

            <h1
              id="daftar-relawan-judul"
              className="text-display mt-5 font-display font-bold text-balance text-white"
            >
              Dua menit mendaftar,
              <br />
              seumur hidup menjaga sungai.
            </h1>

            <p className="measure-editorial mt-6 text-base leading-relaxed text-white opacity-85 md:text-lg">
              Water Ranger adalah warga yang mengukur, mencatat, dan membela sungai di wilayahnya
              sendiri. Kami membekali alat, pelatihan, dan jaringan koordinator; kamu menyumbang
              waktu dan ketelitian.
            </p>

            <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3">
              <div className="flex flex-col gap-1">
                <dt className="order-2 text-xs font-medium uppercase tracking-wider text-white opacity-70">
                  Sungai terpantau
                </dt>
                <dd className="order-1 font-display text-4xl font-bold text-brand-accent">7</dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="order-2 text-xs font-medium uppercase tracking-wider text-white opacity-70">
                  Pos pantau aktif
                </dt>
                <dd className="order-1 font-display text-4xl font-bold text-brand-accent">34</dd>
              </div>
              <div className="col-span-2 flex flex-col gap-1 sm:col-span-1">
                <dt className="order-2 text-xs font-medium uppercase tracking-wider text-white opacity-70">
                  Provinsi jangkauan
                </dt>
                <dd className="order-1 font-display text-4xl font-bold text-brand-accent">9</dd>
              </div>
            </dl>
          </div>

          <div className="animate-fade-up">
            <Figure
              src="/images/water-testing.jpg"
              alt="Relawan Jagatirta menuangkan sampel air sungai ke tabung uji di tepi bantaran."
              caption="Pengujian kualitas air di pos pantau Cisadane, September 2026."
              credit="Dokumentasi Jagatirta"
              ratio="4:3"
              priority
              className="[&_figcaption]:text-white [&_figcaption]:opacity-80"
            />
          </div>
        </div>
      </Section>

      {/* ── Formulir ─────────────────────────────────────────────────────── */}
      <Section className="-mt-12 pb-16 pt-0 md:-mt-16 md:pb-24">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-12">
          <div className="flex flex-col gap-5">
            <h2 className="text-section font-display font-bold text-ink text-balance">
              Formulir pendaftaran
            </h2>
            <p className="measure-editorial text-base leading-relaxed text-ink-secondary">
              Isi empat kolom data diri, lalu pilih cara kamu ingin terlibat. Tidak ada berkas yang
              perlu diunggah dan tidak ada biaya pendaftaran.
            </p>
            <ul className="flex flex-col gap-3">
              <li className="flex items-start gap-3">
                <Badge tone="primary">1</Badge>
                <span className="text-sm leading-relaxed text-ink-secondary">
                  Data diri — nama, WhatsApp, email, dan domisili.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Badge tone="primary">2</Badge>
                <span className="text-sm leading-relaxed text-ink-secondary">
                  Preferensi — sungai pilihan, bidang minat, dan motivasimu.
                </span>
              </li>
            </ul>
            <p className="rounded-2xl border border-editorial bg-surface p-4 text-sm leading-relaxed text-ink-secondary">
              Nomor WhatsApp hanya dipakai koordinator wilayah untuk verifikasi dan jadwal
              orientasi. Kami tidak pernah membagikannya ke pihak ketiga.
            </p>
          </div>

          <VolunteerForm />
        </div>
      </Section>

      {/* ── Tugas Water Ranger ───────────────────────────────────────────── */}
      <Section
        id="tugas"
        tone="dark"
        eyebrow="Peran di lapangan"
        title="Apa yang kamu lakukan sebagai Water Ranger"
        description="Empat pekerjaan konkret yang membuat data sungai tetap hidup dan dapat dipertanggungjawabkan."
      >
        <ol className="grid gap-5 sm:grid-cols-2 lg:gap-6">
          {DUTIES.map((duty, index) => (
            <li key={duty.title} className="h-full">
              <Card className="h-full border-white/15 bg-white/5 text-white">
                <CardBody className="flex h-full flex-col gap-3 px-6 py-7">
                  <span
                    aria-hidden="true"
                    className="font-display text-3xl font-bold text-brand-accent"
                  >
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <CardTitle className="text-white">{duty.title}</CardTitle>
                  <p className="text-sm leading-relaxed text-white opacity-80">{duty.detail}</p>
                </CardBody>
              </Card>
            </li>
          ))}
        </ol>
      </Section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <Section
        id="faq"
        eyebrow="Pertanyaan umum"
        title="Yang paling sering ditanyakan calon relawan"
        description="Belum yakin? Empat jawaban ini biasanya cukup untuk memutuskan."
      >
        <div className="mx-auto flex max-w-3xl flex-col divide-y divide-editorial border-y border-editorial">
          {FAQS.map((faq) => (
            // <details>/<summary> native: tanpa JavaScript, tetap dapat dibuka
            // saat bundel gagal dimuat di jaringan lapangan yang lemah.
            <details key={faq.question} className="group py-2">
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 py-3 text-base font-semibold text-ink transition-colors duration-200 ease-crisp hover:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-canvas [&::-webkit-details-marker]:hidden">
                <span>{faq.question}</span>
                <span
                  aria-hidden="true"
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-editorial text-brand-primary transition-transform duration-200 ease-crisp group-open:rotate-45"
                >
                  <svg
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    className="h-4 w-4"
                  >
                    <path d="M8 3v10M3 8h10" />
                  </svg>
                </span>
              </summary>
              <p className="measure-editorial pb-5 pr-12 text-sm leading-relaxed text-ink-secondary">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </Section>
    </main>
  );
}
