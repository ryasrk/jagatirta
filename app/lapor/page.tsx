import type { Metadata } from 'next';
import { AlertTriangle, PhoneCall, Satellite, Waypoints } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { Badge, Figure, Section } from '@repo/ui';
import { rivers } from '@repo/data';

import { LaporForm } from './lapor-form';

export const metadata: Metadata = {
  title: 'Lapor Pencemaran — Jagatirta River Watch Indonesia',
  description:
    'Laporkan pencemaran sungai dari lokasimu: pilih daerah aliran sungai, tandai titik kejadian, unggah foto, dan dapatkan nomor rujukan yang akan diverifikasi koordinator sungai.',
};

/* -------------------------------------------------------------------------- */
/*  Konten editorial                                                          */
/* -------------------------------------------------------------------------- */

interface ProcessStep {
  /** Angka urut yang ditampilkan besar di sisi kiri catatan. */
  index: string;
  title: string;
  body: string;
  icon: LucideIcon;
  /** Perkiraan waktu yang dibutuhkan pada tahap ini. */
  meta: string;
}

const PROCESS_STEPS: readonly ProcessStep[] = [
  {
    index: '01',
    title: 'Diverifikasi',
    body: 'Koordinator sungai mencocokkan laporanmu dengan data pos pantau, citra satelit, dan laporan warga lain di sekitar titik kejadian. Langkah ini memastikan laporan asli tidak tenggelam di antara kabar palsu.',
    icon: Satellite,
    meta: '1 × 24 jam',
  },
  {
    index: '02',
    title: 'Diselidiki tim patroli',
    body: 'Tim patroli menuju titik koordinat, mengambil sampel air, dan mendokumentasikan kondisi terkini — termasuk bila menemukan sumber pencemaran baru di sekitarnya.',
    icon: Waypoints,
    meta: '3 – 7 hari',
  },
  {
    index: '03',
    title: 'Diterbitkan ke peta atau dieskalasi ke DLH',
    body: 'Hasil yang terverifikasi muncul sebagai titik baru di peta sungai terbuka. Bila terindikasi pelanggaran baku mutu, temuan dieskalasikan ke Dinas Lingkungan Hidup setempat.',
    icon: PhoneCall,
    meta: 'Menyusul',
  },
] as const;

const GOOD_REPORT_POINTS: readonly string[] = [
  'Sertakan patokan yang dikenali warga, bukan hanya nama jalan.',
  'Sebutkan kapan pertama kali terlihat, bukan hanya "sudah lama".',
  'Ambil satu foto dekat dan satu foto sudut lebar dari titik yang sama.',
] as const;

/** Jumlah titik pantau aktif dari data DAS — angka dihitung, bukan ditulis tangan. */
const MONITORED_BASINS = rivers.length;
const CRITICAL_BASINS = rivers.filter((river) => river.status === 'critical').length;

/* -------------------------------------------------------------------------- */
/*  Halaman                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Meja lapor pencemaran.
 *
 * Server component murni: seluruh penjelasan dirender di server (tanpa JavaScript
 * di sisi klien), sementara formulirnya saja yang menyeberang ke klien karena
 * membutuhkan state berkas, GPS, dan validasi lapangan.
 */
export default function LaporPage() {
  return (
    <main className="bg-canvas">
      {/* ── Pembuka: pernyataan pembuka khas Jagatirta ─────────────────── */}
      <section className="relative isolate overflow-hidden bg-brand-deep px-5 py-section-compact text-white sm:px-8 md:py-section-normal">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-28 -z-10 h-72 w-72 rounded-full bg-brand-primary opacity-25 blur-3xl"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -left-20 -z-10 h-64 w-64 rounded-full bg-brand-accent opacity-10 blur-3xl"
        />

        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-center lg:gap-16">
          <div className="animate-fade-up motion-reduce:animate-none">
            <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-brand-accent">
              <span aria-hidden="true" className="h-px w-8 shrink-0 bg-brand-accent opacity-70" />
              Meja Lapor Warga
            </p>

            <h1 className="text-display mt-4 font-display font-bold text-white">
              Sungaimu sedang
              <br />
              dirusak? Catat sekarang.
            </h1>

            <p className="measure-editorial mt-5 text-base leading-relaxed text-white/80 md:text-lg">
              Tujuh hari dalam seminggu, kami menerima laporan dari warga yang tinggal paling dekat
              dengan air. Laporanmu adalah titik data pertama yang kami miliki — sebelum
              laboratorium, sebelum dinas, sebelum berita. Tulis apa yang kamu lihat, bukan apa yang
              kamu dengar.
            </p>

            <dl className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
              <div className="flex items-center gap-3">
                <dd className="font-display text-3xl font-bold text-brand-accent sm:text-4xl">
                  {MONITORED_BASINS}
                </dd>
                <dt className="text-xs uppercase tracking-[0.14em] text-white/85">
                  DAS
                  <br />
                  dipantau
                </dt>
              </div>
              <div className="flex items-center gap-3">
                <dd className="font-display text-3xl font-bold text-brand-accent sm:text-4xl">
                  {CRITICAL_BASINS}
                </dd>
                <dt className="text-xs uppercase tracking-[0.14em] text-white/85">
                  DAS
                  <br />
                  berstatus kritis
                </dt>
              </div>
              <div>
                <Badge tone="warning" dot pulse>
                  Verifikasi manual oleh koordinator
                </Badge>
              </div>
            </dl>
          </div>

          <div
            className="relative hidden lg:block"
            style={{ aspectRatio: '4 / 3' }}
            aria-hidden="true"
          >
            <Figure
              src="/images/water-testing.jpg"
              alt=""
              ratio="4:3"
              priority
              className="h-full"
              frameClassName="h-full border-white/15 ring-white/10"
            />
          </div>
        </div>
      </section>

      {/* ── Bagaimana laporanmu diproses ───────────────────────────────── */}
      <Section
        eyebrow="Alur Laporan"
        title="Bagaimana laporanmu diproses"
        description="Tidak ada laporan yang hilang begitu saja. Setiap kiriman melewati tiga tahap yang sama, dan setiap tahap meninggalkan jejak yang bisa kamu tanyakan dengan nomor rujukanmu."
        id="alur"
      >
        <ol className="grid gap-8 md:grid-cols-3 md:gap-6 lg:gap-10">
          {PROCESS_STEPS.map((step, index) => {
            const Icon = step.icon;
            // Garis penghubung antar tahap: hanya antar kartu, tidak pernah menggantung.
            const isLast = index === PROCESS_STEPS.length - 1;

            return (
              <li key={step.index} className="relative flex flex-col">
                <div className="flex items-center gap-4">
                  <span
                    aria-hidden="true"
                    className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-soft text-brand-primary ring-1 ring-inset ring-brand-primary/20"
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="font-mono text-sm font-semibold tracking-[0.18em] text-brand-primary">
                    {step.index}
                  </span>
                  {isLast ? null : (
                    <span
                      aria-hidden="true"
                      className="hidden h-px flex-1 bg-gradient-to-r from-brand-primary/45 to-transparent md:block"
                    />
                  )}
                </div>

                <h3 className="mt-5 font-display text-xl font-bold leading-snug tracking-tight text-ink">
                  {step.title}
                </h3>

                <p className="measure-editorial mt-3 flex-1 text-[0.9375rem] leading-relaxed text-ink-secondary">
                  {step.body}
                </p>

                <p className="mt-5 border-t border-editorial pt-3 text-xs font-semibold uppercase tracking-[0.14em] text-ink-secondary">
                  Perkiraan {step.meta}
                </p>
              </li>
            );
          })}
        </ol>
      </Section>

      {/* ── Peringatan laporan palsu + panduan singkat ─────────────────── */}
      <section className="bg-brand-deep px-5 py-section-compact text-white sm:px-8 md:py-section-normal">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-16">
          <div>
            <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-brand-accent">
              <AlertTriangle aria-hidden="true" focusable="false" className="h-4 w-4 shrink-0" />
              Sebelum kamu mengirim
            </p>
              <h2 className="text-section mt-4 font-display font-bold text-white">
              Laporan palsu membuang waktu relawan lapangan
            </h2>
            <p className="measure-editorial mt-4 text-base leading-relaxed text-white/80 md:text-lg">
              Satu laporan yang tidak benar memaksa tim patroli menempuh perjalanan berjam-jam ke
              lokasi yang tidak bermasalah — dan itu adalah jam yang seharusnya dipakai memeriksa
              pencemaran sungguhan di titik lain. Bila kamu ragu, pilih opsi paling mendekati dan
              jelaskan keraguan itu di kolom deskripsi. Ketidakpastian yang jujur selalu lebih
              berguna daripada kepastian yang dibuat-buat.
            </p>
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/5 p-6 sm:p-7">
            <h3 className="font-display text-lg font-semibold text-white">
              Tiga hal yang membuat laporan cepat ditindaklanjuti
            </h3>
            <ul className="mt-5 space-y-4">
              {GOOD_REPORT_POINTS.map((point, index) => (
                <li key={point} className="flex items-start gap-3">
                  <span
                    aria-hidden="true"
                    className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-accent/20 text-xs font-bold text-brand-accent"
                  >
                    {index + 1}
                  </span>
                  <span className="text-[0.9375rem] leading-relaxed text-white/85">{point}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 border-t border-white/15 pt-4 text-sm leading-relaxed text-white/85">
              Butuh bantuan langsung? Hubungi koordinator sungai terdekatmu melalui kanal kontak di
              bagian bawah halaman ini — sebutkan nama sungai dan patokan lokasinya.
            </p>
          </div>
        </div>
      </section>

      {/* ── Formulir ───────────────────────────────────────────────────── */}
      <Section
        eyebrow="Formulir Laporan"
        title="Kirim laporanmu"
        description="Tiga bagian singkat: lokasi kejadian, apa yang kamu saksikan, dan cara kami boleh menghubungimu. Kolom bertanda bintang wajib diisi; sisanya membuat tim verifikasi bergerak jauh lebih cepat."
        id="formulir"
      >
        <div className="grid gap-10 lg:grid-cols-[minmax(0,8fr)_minmax(0,4fr)] lg:items-start lg:gap-14">
          <div className="rounded-2xl border border-editorial bg-surface p-5 shadow-sm sm:p-8 lg:p-10">
            <LaporForm />
          </div>

          <aside className="flex flex-col gap-6 lg:sticky lg:top-24">
            <div className="rounded-2xl border border-editorial bg-surface p-6">
              <h3 className="font-display text-base font-semibold text-ink">
                Kamu akan menerima ini
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-secondary">
                Sebuah nomor rujukan seperti{' '}
                <span className="font-mono font-semibold text-brand-deep">LAP-2026-SEP13-4821</span>
                . Simpan nomor itu: seluruh percakapan lanjutan tentang laporanmu ditelusuri lewat
                kode tersebut.
              </p>
            </div>

            <div className="rounded-2xl border border-editorial bg-surface p-6">
              <h3 className="font-display text-base font-semibold text-ink">
                Kalau sungai belum ada di daftar
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-secondary">
                Pilih DAS terdekat yang paling mungkin menampung alirannya, lalu tulis nama sungai
                aslinya di kolom patokan lokasi. Koordinator akan memperbarui data DAS setelah
                verifikasi.
              </p>
            </div>

            <div className="rounded-2xl border border-editorial bg-surface p-6">
              <h3 className="font-display text-base font-semibold text-ink">
                Keadaan mendesak
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-secondary">
                Bila pencemaran sedang berlangsung dan mengancam jiwa warga — tumpahan besar, bau
                menyengat yang memaksa evakuasi, atau air berubah warna secara mendadak — hubungi
                aparat desa dan Dinas Lingkungan Hidup setempat lebih dulu, baru catat laporannya di
                sini sebagai bukti tertulis.
              </p>
            </div>
          </aside>
        </div>
      </Section>
    </main>
  );
}
