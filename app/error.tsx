'use client';

import { useEffect } from 'react';
import { Button, Section } from '@repo/ui';

/**
 * Batas galat tingkat segmen untuk Jagatirta.
 *
 * Next.js mewajibkan `'use client'` di sini karena batas galat harus menangkap
 * galat saat render di sisi klien dan menyediakan `reset()`.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Jejak galat dikirim ke konsol agar tim lapangan dapat melaporkan
    // `digest` ke pengembang tanpa harus merekam layar.
    console.error(error);
  }, [error]);

  return (
    <Section tone="light" className="flex min-h-[60vh] items-center">
      <div className="mx-auto flex max-w-3xl flex-col items-start">
        <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-brand-primary">
          <span aria-hidden="true" className="h-px w-8 shrink-0 bg-brand-primary opacity-60" />
          Gangguan sementara
        </p>

        <h1 className="text-display mt-6 font-display font-bold text-ink text-balance">
          Terjadi kesalahan
        </h1>

        <p className="measure-editorial mt-5 text-base leading-relaxed text-ink-secondary md:text-lg">
          Kami tidak berhasil memuat bagian ini. Data sungai Anda tetap aman dan
          tidak ada laporan yang hilang.
        </p>

        <p className="measure-editorial mt-3 text-base leading-relaxed text-ink-secondary md:text-lg">
          Coba muat ulang sebentar lagi. Bila masih gagal, kembali ke beranda
          atau hubungi kami di{' '}
          <a
            href="mailto:halo@jagatirta.id"
            className="font-semibold text-brand-primary underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
          >
            halo@jagatirta.id
          </a>
          .
        </p>

        <div className="mt-9 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
          <Button
            variant="primary"
            size="lg"
            className="w-full sm:w-auto"
            onClick={() => reset()}
          >
            Coba lagi
          </Button>

          <Button variant="outline" size="lg" href="/" className="w-full sm:w-auto">
            Kembali ke Beranda
          </Button>
        </div>

        {error.digest ? (
          // Kode galat membantu pencarian log; dibaca pembaca layar sebagai teks
          // biasa, bukan diandalkan pada warna.
          <p className="measure-editorial mt-8 text-sm leading-relaxed text-ink-secondary">
            Kode galat untuk laporan:{' '}
            <code className="rounded bg-brand-soft px-2 py-1 font-mono text-xs text-brand-deep">
              {error.digest}
            </code>
          </p>
        ) : null}
      </div>
    </Section>
  );
}
