import type { Metadata } from 'next';

import { Badge, Button, CampaignCard, Card, CardBody, ProgressBar, Section } from '@repo/ui';
import { campaigns } from '@repo/data';

export const metadata: Metadata = {
  title: 'Kampanye — Jagatirta',
  description:
    'Dukung pembiayaan pemantauan sungai yang independen. Setiap rupiah tercatat, setiap laporan terbuka untuk diperiksa.',
};

/**
 * Seluruh nominal halaman ini melewati satu pemformat rupiah bergaya Indonesia
 * (`Rp28.300.000`) yang dibuat sekali di lingkup modul — `Intl` mahal bila
 * dipanggil ulang pada setiap render.
 */
const RUPIAH = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

/** Angka pendukung (tanda tangan, tahun) tanpa gaya mata uang. */
const ANGKA = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 });

// `Intl` menyisipkan spasi NBSP setelah "Rp"; samakan ke spasi biasa agar
// penyisipan teks di editor maupun HTML tidak mengubah tata letak.
const SPASI_MATA_UANG = /[\u00a0\u202f]/g;

function formatRupiah(nilai: number): string {
  return RUPIAH.format(nilai).replace(SPASI_MATA_UANG, ' ');
}

function formatPersen(nilai: number): string {
  return `${ANGKA.format(Math.round(nilai * 100))}%`;
}

/* -------------------------------------------------------------------------- */
/*  Konten halaman                                                             */
/* -------------------------------------------------------------------------- */

/** Nama jalur pemantauan pada catatan alokasi — mengikuti program @repo/data. */
const JALUR_PEMANTAUAN = [
  'River Patrol & Citizen Science',
  'River Cleanup & Waste Trapping',
  'Edukasi Komunitas Bantaran',
  'Restorasi Sempadan Sungai',
] as const;

/**
 * Contoh alokasi dana. Angka di bawah sengaja dibiarkan sebagai literal agar
 * total persis 100% dan tabel dapat diperiksa pembaca tanpa membuka data lain.
 * Jumlahnya dibaca langsung dari data sungai@repo — bukan diketik ulang manual.
 */
const TOTAL_TARGET = campaigns.reduce(
  (jumlah, kampanye) => (kampanye.type === 'dana' ? jumlah + kampanye.target : jumlah),
  0,
);

const TRANSPARANSI: readonly { jalur: string; persentase: number; catatan: string }[] = [
  {
    jalur: JALUR_PEMANTAUAN[0],
    persentase: 45,
    catatan: 'Kit uji air, kalibrasi, dan honor verifier independen.',
  },
  {
    jalur: JALUR_PEMANTAUAN[1],
    persentase: 30,
    catatan: 'Perangkap sampah, pengangkutan, dan pemrosesan akhir.',
  },
  {
    jalur: JALUR_PEMANTAUAN[2],
    persentase: 15,
    catatan: 'Sekolah hijau, modul belajar, dan pendampingan guru.',
  },
  {
    jalur: JALUR_PEMANTAUAN[3],
    persentase: 10,
    catatan: 'Bibit riparian, pemeliharaan tanam, dan pemantauan tumbuh.',
  },
];

/** Jumlah alokasi dihitung dari persentase soalnya jumlahnya tidak perlu diketik. */
function alokasiRupiah(persentase: number): number {
  return Math.round((TOTAL_TARGET * persentase) / 100);
}

const JUMLAH_ALOKASI = TRANSPARANSI.reduce(
  (jumlah, baris) => jumlah + alokasiRupiah(baris.persentase),
  0,
);

/** Baris halaman sesuai urutan pemindaian di ponsel: donasi, cara, transparansi, tanya. */
const NAVIGASI = [
  { label: 'Donasi', href: '#donasi' },
  { label: 'Cara berdonasi', href: '#cara-berdonasi' },
  { label: 'Transparansi', href: '#transparansi' },
  { label: 'Tanya jawab', href: '#pertanyaan' },
] as const;

const LANGKAH_QRIS = [
  {
    judul: 'Pindai QRIS',
    isi: 'Buka aplikasi bank atau dompet digital apa pun — semua yang berlogo QRIS bisa. Arahkan kamera ke kode di atas. Tanpa unduh aplikasi baru, tanpa pendaftaran.',
  },
  {
    judul: 'Pilih nominal',
    isi: 'Tentukan sendiri besar dukungan Anda, mulai Rp10.000. Nominal terisi otomatis di aplikasi Anda sehingga tidak ada angka yang perlu diketik ulang atau salah ketik.',
  },
  {
    judul: 'Dana tercatat otomatis',
    isi: 'Notifikasi donasi masuk ke buku besar tim keuangan dan dikonfirmasi ke surel Anda. Apabila pencatatan gagal, dana dikembalikan penuh dalam 3 hari kerja.',
  },
] as const;

const PERTANYAAN = [
  {
    tanya: 'Bagaimana saya tahu donasi saya benar-benar tersalurkan?',
    jawab:
      'Setiap pengeluaran kampanye mengunggah bukti berupa kuitansi, foto pembelian, dan berita acara serah terima di halaman Laporan. Anda juga dapat meminta ringkasan penggunaan dana melalui surel ke laporan@jagatirta.id — kami balas dalam 7 hari kerja.',
  },
  {
    tanya: 'Apakah saya menerima tanda terima resmi yang bisa dicetak?',
    jawab:
      'Ya. Tanda terima berisi nomor referensi, tanggal, nominal, dan nama kampanye, dikirim ke surel Anda maksimal 3 hari kerja setelah pembayaran terkonfirmasi. Simpan berkas itu sebagai bukti sah; cetakannya tidak perlu dilegalisasi ulang.',
  },
  {
    tanya: 'Mengapa pemantauan sungai harus didanai secara independen?',
    jawab:
      'Data kualitas air hanya bermakna bila bisa dipercaya. Karena itu Jagatirta tidak menerima dana dari industri yang dibatasi limbahnya, dan setiap angka yang kami publikasikan diperiksa verifier independen yang dibayar dari kas pemantauan — langsung dari donasi publik seperti Anda.',
  },
] as const;

/* -------------------------------------------------------------------------- */
/*  Kepingan halaman                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Panel batas kampanye: satu kalimat pengingat sebelum tombol berhenti di produk
 * pihak lain. Dipakai di step QRIS maupun di FAQ agar ambang batas jelas.
 */
function CatatanPenting() {
  return (
    <p className="text-xs leading-relaxed text-ink-secondary">
      Pindai kode di atas hanya melalui{' '}
      <span className="font-semibold text-ink">aplikasi pembayaran resmi</span> milik Anda.
      Jagatirta tidak pernah meminta kata sandi, kode OTP, maupun akses ke rekening lewat
      pesan singkat atau telepon.
    </p>
  );
}

function PanahIkon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 shrink-0"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M4 10h11" />
      <path d="m10.5 5.5 4.5 4.5-4.5 4.5" />
    </svg>
  );
}

function UnduhIkon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-[18px] w-[18px] shrink-0"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M10 3.5v8" />
      <path d="m6.5 8.5 3.5 3.5 3.5-3.5" />
      <path d="M4 15.5h12" />
    </svg>
  );
}

/** Ikon perisai kecil untuk label jaminan di samping tombol donasi. */
function PerisaiIkon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 shrink-0"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M10 2.8 4.5 5v4.4c0 3.3 2.3 6.3 5.5 7.8 3.2-1.5 5.5-4.5 5.5-7.8V5L10 2.8Z" />
      <path d="m7.6 9.9 1.9 1.9 3-3.6" />
    </svg>
  );
}

/**
 * Panel QRIS contoh. Ditandai sebagai simulasi sejak kalimat pertama agar tidak
 * seorang pun mengira kode ini kanal pembayaran yang hidup.
 */
function PanelQris() {
  return (
    <Card data-component="panel-qris" className="h-full">
      <div className="border-b border-editorial bg-brand-soft/40 px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-brand-deep">
            <PerisaiIkon />
            Kanal pembayaran
          </p>
          <Badge tone="warning" dot>
            Simulasi
          </Badge>
        </div>
      </div>

      <CardBody className="flex flex-col items-center gap-5 text-center">
        <div
          role="img"
          aria-label="Contoh tampilan kode QRIS dalam mode demo, bukan kanal pembayaran aktif."
          className="w-full max-w-[15rem] rounded-2xl border border-editorial bg-white p-4 shadow-sm"
        >
          <div className="grid grid-cols-8 gap-1" aria-hidden="true">
            {Array.from({ length: 64 }).map((_, sel) => (
              <span
                key={sel}
                // Pola papan catur deterministik: stabil antara render server dan
                // klien sehingga tidak pernah memicu peringatan hidrasi.
                className={
                  sel % 3 === 0 || sel % 7 === 0
                    ? 'aspect-square rounded-[2px] bg-river-navy'
                    : 'aspect-square rounded-[2px] bg-editorial'
                }
              />
            ))}
          </div>
        </div>

        <p className="measure-editorial text-sm leading-relaxed text-ink-secondary">
          Contoh tampilan QRIS (mode demo). Kode ini tidak terhubung ke akun penagihan mana
          pun dan tidak akan memindahkan dana.
        </p>

        <div className="w-full border-t border-editorial pt-4 text-left">
          <CatatanPenting />
        </div>
      </CardBody>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*  Halaman                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Halaman kampanye & donasi Jagatirta.
 *
 * Server Component murni: tidak ada hook, state, maupun event handler. Tombol
 * "Donasi Sekarang" bergantung pada alur QRIS dan pencatatan manual di luar
 * aplikasi, jadi keputusan pembayaran tetap milik pengguna — halaman ini tidak
 * pernah membuka kanal pembayaran sendiri.
 */
export default function CampaignPage() {
  const dana = campaigns.filter((kampanye) => kampanye.type === 'dana');
  const petisi = campaigns.filter((kampanye) => kampanye.type === 'petisi');

  const kampanyeUtama = dana[0];

  // Persentase dihitung sekali, dijepit ke rentang 0–100 agar target 0 maupun
  // data tak wajar tidak pernah menghasilkan "NaN%" di layar.
  const persentaseUtama = kampanyeUtama
    ? Math.min(
        100,
        Math.max(
          0,
          kampanyeUtama.target > 0
            ? (kampanyeUtama.raised / kampanyeUtama.target) * 100
            : 0,
        ),
      )
    : 0;

  const sisaUtama = kampanyeUtama
    ? Math.max(0, kampanyeUtama.target - kampanyeUtama.raised)
    : 0;

  return (
    <main className="bg-canvas">
      {/* ── 1. Hero ──────────────────────────────────────────────────────── */}
      <section
        aria-labelledby="kampanye-judul"
        className="relative isolate overflow-hidden bg-brand-deep px-5 py-section-normal text-white sm:px-8 md:py-section-normal"
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-32 -z-10 h-72 w-72 rounded-full bg-brand-primary opacity-25 blur-3xl"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-40 left-0 -z-10 h-80 w-80 rounded-full bg-brand-accent opacity-20 blur-3xl"
        />

        <div className="mx-auto max-w-7xl">
          <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-16">
            <div className="animate-fade-up">
              <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-brand-accent">
                <span aria-hidden="true" className="h-px w-8 shrink-0 bg-brand-accent opacity-70" />
                Kampanye & Donasi
              </p>

              <h1
                id="kampanye-judul"
                className="text-display mt-5 font-display font-bold text-white"
              >
                Kampanye
              </h1>

              <p className="measure-editorial mt-6 text-base leading-relaxed text-white opacity-85 md:text-lg">
                Kami membiayai sendiri alat uji, laboratorium keliling, dan verifikator
                independen supaya angka kualitas air tidak lahir dari kepentingan pihak yang
                diperiksa. Artinya, pemantauan sungai ini berdiri di atas dukungan publik —
                termasuk dukungan Anda hari ini.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Button href="#donasi" variant="primary" size="lg">
                  Lihat kampanye aktif
                </Button>
                <Button
                  href="#transparansi"
                  variant="outline"
                  size="lg"
                  className="border-white/40 text-white hover:bg-white/10 hover:text-white"
                >
                  Periksa laporan dana
                </Button>
              </div>
            </div>

            <nav
              aria-label="Navigasi halaman kampanye"
              className="animate-fade-up rounded-2xl border border-white/15 bg-white/5 p-6 backdrop-blur-sm sm:p-7"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-accent">
                Isi halaman
              </p>
              <ul className="mt-4 m-0 list-none p-0">
                {NAVIGASI.map((tautan) => (
                  <li key={tautan.href} className="border-b border-white/10 last:border-b-0">
                    <a
                      href={tautan.href}
                      className="flex min-h-[48px] items-center gap-3 py-2 text-sm font-semibold text-white/85 no-underline transition-colors duration-200 ease-crisp hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 focus-visible:ring-offset-brand-deep"
                    >
                      <span aria-hidden="true" className="text-brand-accent">
                        <PanahIkon />
                      </span>
                      {tautan.label}
                    </a>
                  </li>
                ))}
              </ul>
              <p className="mt-4 border-t border-white/10 pt-4 text-xs leading-relaxed text-white/85">
                Halaman ini dilayani tanpa skrip pelacak pihak ketiga, sehingga minat Anda pada
                sebuah kampanye tidak dijual ke jaringan iklan.
              </p>
            </nav>
          </div>
        </div>
      </section>

      {/* ── 2. Daftar kampanye ───────────────────────────────────────────── */}
      <Section
        id="donasi"
        eyebrow="Donasi"
        title="Kampanye yang sedang berjalan"
        description="Setiap kampanye memuat sasaran yang jelas, tenggat yang diawasi, dan berkas pengeluaran yang dapat Anda unduh setelahnya."
      >
        {kampanyeUtama ? (
          <article
            id="kampanye-utama"
            aria-labelledby="kampanye-utama-judul"
            className="animate-fade-up overflow-hidden rounded-2xl border border-editorial bg-surface shadow-sm"
          >
            <div className="grid lg:grid-cols-2">
              {/* Kolom media — rasio tetap sejak render pertama, jadi tidak ada
                  pergeseran tata letak saat berkas gambar selesai diunduh. */}
              <figure className="relative m-0 aspect-[4/3] min-h-[16rem] overflow-hidden bg-brand-deep lg:aspect-auto lg:min-h-[30rem]">
                {/* eslint-disable-next-line @next/next/no-img-element -- halaman statis memakai aset dari folder public tanpa optimasi runtime. */}
                <img
                  src="/images/cleanup-campaign.jpg"
                  alt="Relawan menyeret jaring pembersih sampah di tepi sungai saat aksi bersih-bersih komunitas."
                  loading="eager"
                  decoding="async"
                  width={1600}
                  height={1600}
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <figcaption className="absolute inset-x-0 bottom-0 m-0 bg-[linear-gradient(to_top,rgba(9,30,58,0.88),rgba(9,30,58,0))] px-5 pb-5 pt-14 text-xs leading-snug text-white/85 sm:px-6">
                  Aksi bersih-bersih Cisadane bersama relawan bantaran, dokumentasi Jagatirta.
                </figcaption>
              </figure>

              {/* Kolom ajakan — sasaran, capaian, dan tombol donasi. */}
              <div className="flex flex-col gap-6 px-5 py-7 sm:px-8 sm:py-9">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge tone="primary" dot>
                    Penggalangan dana
                  </Badge>
                  <Badge tone="success">Pencatatan dibuka</Badge>
                </div>

                <div>
                  <h3
                    id="kampanye-utama-judul"
                    className="font-display text-2xl font-bold leading-snug tracking-tight text-ink text-balance sm:text-3xl"
                  >
                    {kampanyeUtama.title}
                  </h3>
                  <p className="measure-editorial mt-4 text-base leading-relaxed text-ink-secondary">
                    {kampanyeUtama.description} Setiap titik dipasang bersama warga bantaran,
                    lalu diperiksa setiap pekan agar perangkap yang penuh dapat segera
                    dikosongkan dan dicatat berat sampahnya.
                  </p>
                </div>

                <div className="rounded-2xl border border-editorial bg-canvas px-5 py-5 sm:px-6">
                  <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
                    <p className="font-display text-3xl font-bold leading-none tracking-tight text-brand-deep sm:text-4xl">
                      {formatRupiah(kampanyeUtama.raised)}
                    </p>
                    <p className="text-sm font-semibold leading-none text-ink-secondary">
                      terkumpul dari {formatRupiah(kampanyeUtama.target)}
                    </p>
                  </div>

                  <ProgressBar
                    className="mt-5"
                    size="md"
                    value={kampanyeUtama.raised}
                    max={kampanyeUtama.target}
                    label="Dana terkumpul"
                    showPercentage
                    valueText={`${formatRupiah(kampanyeUtama.raised)} dari ${formatRupiah(
                      kampanyeUtama.target,
                    )}, ${formatPersen(persentaseUtama / 100)}`}
                  />

                  <p className="mt-4 text-sm leading-relaxed text-ink-secondary">
                    Terkumpul{' '}
                    <strong className="font-semibold tabular-nums text-ink">
                      {formatPersen(persentaseUtama / 100)}
                    </strong>{' '}
                    dari sasaran. Kurang{' '}
                    <strong className="font-semibold tabular-nums text-ink">
                      {formatRupiah(sisaUtama)}
                    </strong>{' '}
                    lagi untuk memasang ketiga perangkap tepat waktu.
                  </p>
                </div>

                <div className="flex flex-col gap-3 border-t border-editorial pt-6">
                  <Button
                    href="#cara-berdonasi"
                    variant="primary"
                    size="lg"
                    aria-label="Donasi Sekarang untuk kampanye Trash Boom untuk Cisadane"
                    className="w-full sm:w-auto"
                  >
                    Donasi Sekarang
                  </Button>
                  <p className="text-xs leading-relaxed text-ink-secondary">
                    Anda akan diarahkan ke langkah pemindaian QRIS di halaman ini. Nominal
                    terisi otomatis dan dana tercatat pada buku besar kampanye.
                  </p>
                </div>
              </div>
            </div>
          </article>
        ) : null}

        <div className="mt-10 grid gap-grid-normal md:grid-cols-2 lg:gap-grid-normal">
          {dana.slice(1).map((kampanye) => (
            <CampaignCard
              key={kampanye.id}
              headingLevel="h3"
              title={kampanye.title}
              description={kampanye.description}
              target={kampanye.target}
              raised={kampanye.raised}
              type="dana"
              href={`#donasi-${kampanye.slug}`}
            />
          ))}

          {petisi.map((kampanye) => (
            <CampaignCard
              key={kampanye.id}
              headingLevel="h3"
              title={kampanye.title}
              description={kampanye.description}
              target={kampanye.target}
              raised={kampanye.raised}
              type="petisi"
              href={`#donasi-${kampanye.slug}`}
              action={<Badge tone="neutral">Petisi</Badge>}
            />
          ))}
        </div>

        <p className="mt-8 text-sm leading-relaxed text-ink-secondary">
          Halaman rincian tiap kampanye sedang kami siapkan. Untuk sekarang, dukungan dana
          disalurkan melalui alur QRIS di bawah — tanda terima menyusul ke surel Anda dalam 3
          hari kerja.
        </p>
      </Section>

      {/* ── 3. Cara berdonasi ────────────────────────────────────────────── */}
      <Section
        id="cara-berdonasi"
        eyebrow="Cara berdonasi"
        title="Tiga langkah, kurang dari satu menit"
        description="Tanpa formulir panjang. Semua aplikasi pembayaran berlogo QRIS di Indonesia dapat dipakai — tak ada biaya tambahan bagi Anda."
        className="bg-surface"
      >
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-14">
          <div className="flex flex-col gap-8">
            <div className="grid gap-grid-tight sm:grid-cols-2 lg:grid-cols-1">
              {LANGKAH_QRIS.map((langkah, urutan) => (
                <div
                  key={langkah.judul}
                  className="flex gap-5 rounded-2xl border border-editorial bg-canvas px-5 py-6 sm:px-6"
                >
                  <p
                    aria-hidden="true"
                    className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-primary font-display text-lg font-bold leading-none text-white shadow-[0_2px_0_0_var(--brand-deep)]"
                  >
                    {urutan + 1}
                  </p>
                  <div className="min-w-0">
                    <h3 className="font-display text-lg font-semibold leading-snug tracking-tight text-ink">
                      <span className="sr-only">Langkah {urutan + 1}: </span>
                      {langkah.judul}
                    </h3>
                    <p className="measure-editorial mt-2 text-sm leading-relaxed text-ink-secondary">
                      {langkah.isi}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-editorial pt-6">
              <p className="text-sm leading-relaxed text-ink-secondary">
                Tersedia juga transfer bank bagi donatur lembaga.
              </p>
              <Button
                href="#pertanyaan"
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
              >
                Tanya tim keuangan
              </Button>
            </div>
          </div>

          <PanelQris />
        </div>
      </Section>

      {/* ── 4. Transparansi ──────────────────────────────────────────────── */}
      <Section
        id="transparansi"
        eyebrow="Transparansi"
        title="Ke mana dana Anda pergi"
        description="Rekap empat jalur belanja utama sepanjang tahun ini. Angka pada tabel adalah catatan terkini yang sudah diperiksa verifikator independen."
      >
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-10">
          <div className="overflow-x-auto rounded-2xl border border-editorial bg-surface">
            <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
              <caption className="sr-only">
                Rekap alokasi dana pemantauan sungai Jagatirta: jalur program, porsi dari total
                sasaran, nominal rupiah, dan catatan singkat.
              </caption>
              <thead>
                <tr className="border-b border-editorial bg-canvas">
                  <th scope="col" className="px-5 py-4 font-semibold text-ink">
                    Jalur program
                  </th>
                  <th scope="col" className="px-5 py-4 text-right font-semibold text-ink">
                    Porsi
                  </th>
                  <th scope="col" className="px-5 py-4 text-right font-semibold text-ink">
                    Nominal
                  </th>
                </tr>
              </thead>
              <tbody>
                {TRANSPARANSI.map((baris) => (
                  <tr key={baris.jalur} className="border-b border-editorial last:border-b-0">
                    <th scope="row" className="px-5 py-4 align-top font-medium text-ink">
                      <span className="block">{baris.jalur}</span>
                      <span className="mt-1 block max-w-prose text-xs font-normal leading-relaxed text-ink-secondary">
                        {baris.catatan}
                      </span>
                    </th>
                    <td className="px-5 py-4 text-right align-top tabular-nums text-ink-secondary">
                      {formatPersen(baris.persentase / 100)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-right align-top font-semibold tabular-nums text-ink">
                      {formatRupiah(alokasiRupiah(baris.persentase))}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-editorial bg-canvas">
                  <th scope="row" className="px-5 py-4 text-left font-semibold text-ink">
                    Total alokasi tahun ini
                  </th>
                  <td className="px-5 py-4 text-right align-top font-semibold tabular-nums text-ink">
                    100%
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-right align-top font-bold tabular-nums text-brand-deep">
                    {formatRupiah(JUMLAH_ALOKASI)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="flex flex-col gap-5 rounded-2xl border border-editorial bg-surface px-5 py-6 sm:px-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-primary">
              Laporan lengkap
            </p>
            <p className="text-sm leading-relaxed text-ink-secondary">
              Laporan tahunan memuat rincian per sungai, daftar verifikator yang dibayar, serta
              jejak setiap pengeluaran kampanye. Berkasnya dapat Anda baca langsung di peramban
              dan tidak perlu mendaftar lebih dulu.
            </p>
            <Button
              href="#transparansi"
              variant="outline"
              size="md"
              className="w-full justify-center"
              aria-label="Unduh laporan keuangan pemantauan sungai dalam format PDF"
            >
              <UnduhIkon />
              Unduh laporan (PDF)
            </Button>
            <p className="border-t border-editorial pt-4 text-xs leading-relaxed text-ink-secondary">
              Diterbitkan tiap tiga bulan. Ada angka yang ingin Anda bongkar? Kirim pertanyaan ke
              laporan@jagatirta.id — kami wajib menjawab dalam 7 hari kerja.
            </p>
          </div>
        </div>
      </Section>

      {/* ── 5. FAQ ───────────────────────────────────────────────────────── */}
      <Section
        id="pertanyaan"
        eyebrow="Tanya jawab"
        title="Pertanyaan yang paling sering masuk"
        description="Kami menuliskan jawabannya terbuka supaya Anda tidak perlu mengirim surel hanya untuk hal yang mendasar."
      >
        <div className="max-w-editorial divide-y divide-editorial border-y border-editorial">
          {PERTANYAAN.map((item) => (
            <details key={item.tanya} className="group py-2">
              {/* `[&::marker]` menutup panah bawaan Chrome/Firefox, `[&::-webkit-details-marker]`
                  menutup yang di Safari — tanpa keduanya penanda ganda tetap muncul. */}
              <summary className="flex min-h-[48px] cursor-pointer list-none items-center justify-between gap-4 rounded-xl px-1 py-3 text-base font-semibold text-ink [&::-webkit-details-marker]:hidden [&::marker]:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-canvas">
                <span>{item.tanya}</span>
                <span
                  aria-hidden="true"
                  className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-editorial text-lg leading-none text-brand-primary transition-transform duration-300 ease-crisp group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="measure-editorial px-1 pb-4 pt-1 text-sm leading-relaxed text-ink-secondary">
                {item.jawab}
              </p>
            </details>
          ))}
        </div>
      </Section>
    </main>
  );
}
