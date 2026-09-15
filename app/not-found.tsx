import type { Metadata } from 'next';
import Link from 'next/link';
import { Section } from '@repo/ui';

/**
 * 404 global untuk Jagatirta.
 *
 * Sengaja tetap Server Component (tanpa `'use client'`) karena hanya merender
 * tautan statis: tidak ada state, tidak ada handler, dan `metadata` hanya boleh
 * diekspor dari komponen server.
 */
export const metadata: Metadata = {
  title: 'Halaman tidak ditemukan',
};

/** Tautan pemulihan: jalur terpendek menuju data sungai dan cara ikut terlibat. */
const tautanBantuan = [
  {
    href: '/',
    label: 'Kembali ke Beranda',
    keterangan: 'Ringkasan kondisi sungai dan kabar terbaru.',
  },
  {
    href: '/lokasi',
    label: 'Lihat Lokasi Pemantauan',
    keterangan: 'Tujuh sungai yang kami pantau bersama warga.',
  },
  {
    href: '/lapor',
    label: 'Laporkan Pencemaran',
    keterangan: 'Temukan masalah di sungai? Sampaikan ke tim kami.',
  },
];

export default function NotFound() {
  return (
    <Section
      tone="light"
      className="flex min-h-[60vh] items-center"
      aria-labelledby="judul-404"
    >
      <div className="mx-auto flex max-w-3xl flex-col items-start">
        <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-brand-primary">
          <span aria-hidden="true" className="h-px w-8 shrink-0 bg-brand-primary opacity-60" />
          Galat 404
        </p>

        <h1
          id="judul-404"
          className="text-display mt-6 font-display font-bold text-ink text-balance"
        >
          Halaman tidak ditemukan
        </h1>

        <p className="measure-editorial mt-5 text-base leading-relaxed text-ink-secondary md:text-lg">
          Alamat yang Anda buka tidak tersedia. Halaman ini mungkin sudah
          dipindahkan ke alamat baru, berganti nama, atau tidak pernah ada.
        </p>

        <p className="measure-editorial mt-3 text-base leading-relaxed text-ink-secondary md:text-lg">
          Silakan pilih salah satu tautan di bawah ini untuk melanjutkan.
        </p>

        {/*
         * Daftar tautan, bukan sekadar kumpulan tombol: setiap butir memasangkan
         * label yang jelas dengan keterangan singkat, dan seluruh area kartu
         * menjadi target sentuh jauh di atas 48px.
         */}
        <nav className="mt-10 w-full" aria-label="Tautan bantuan">
          <ul className="grid list-none gap-grid-tight p-0 sm:grid-cols-3">
            {tautanBantuan.map((tautan) => (
              <li key={tautan.href} className="m-0">
                <Link
                  href={tautan.href}
                  className="flex min-h-[48px] flex-col justify-center rounded-2xl border border-editorial bg-surface px-5 py-4 no-underline transition-colors duration-200 ease-crisp hover:border-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
                >
                  <span className="font-display text-base font-semibold text-ink">
                    {tautan.label}
                  </span>
                  <span className="mt-1 text-sm leading-relaxed text-ink-secondary">
                    {tautan.keterangan}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <p className="mt-8 text-sm leading-relaxed text-ink-secondary">
          Butuh bantuan lain? Hubungi kami di{' '}
          <a
            href="mailto:halo@jagatirta.id"
            className="inline-flex min-h-[48px] items-center font-semibold text-brand-primary underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
          >
            halo@jagatirta.id
          </a>
          .
        </p>
      </div>
    </Section>
  );
}
