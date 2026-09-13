import type { Metadata } from 'next';

import { Button, EmptyState, Section } from '@repo/ui';

export const metadata: Metadata = {
  title: 'Sungai tidak ditemukan — Jagatirta',
  description: 'Dossier sungai yang Anda cari tidak tersedia di pangkalan data Jagatirta.',
};

/** Halaman 404 untuk rute dossier sungai — bahasa tenang, satu langkah kembali. */
export default function LokasiNotFound() {
  return (
    <main className="bg-canvas">
      <Section align="center" className="min-h-[60svh] flex items-center">
        <div className="mx-auto flex w-full max-w-xl flex-col items-center text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-primary">
            Eror 404
          </p>
          <h1 className="text-section mt-4 font-display font-bold text-balance text-ink">
            Sungai tidak ditemukan
          </h1>
          <p className="measure-editorial mt-4 text-base leading-relaxed text-ink-secondary md:text-lg">
            Dossier yang Anda cari belum terdaftar dalam pemantauan kami. Tujuh daerah aliran
            sungai yang sedang kami pantau dapat Anda lihat pada halaman lokasi.
          </p>

          <EmptyState
            className="mt-10 w-full"
            title="Belum ada dossier di alamat ini"
            description="Periksa kembali tautan yang Anda bagikan, atau telusuri langsung daftar sungai yang kami pantau."
            action={
              <Button href="/lokasi" variant="primary" size="md">
                Kembali ke daftar lokasi
              </Button>
            }
          />
        </div>
      </Section>
    </main>
  );
}
