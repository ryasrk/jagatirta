'use client';

import { useEffect } from 'react';

/**
 * Batas galat tingkat akar (root) untuk Jagatirta.
 *
 * Saat galat terjadi di root layout, Next.js mengganti seluruh dokumen,
 * sehingga komponen ini WAJIB merender sendiri `<html>` dan `<body>`.
 *
 * Gaya ditulis inline dan sengaja bebas dari `@repo/ui` maupun
 * `@repo/ui/styles/globals.css` — berkas tersebut tidak diimpor di sini karena
 * sudah dimuat oleh root layout. Bila kegagalan berasal dari CSS atau paket UI,
 * halaman darurat ini tetap tampil rapi tanpa bergantung pada keduanya.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="id" className="theme-jagatirta">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px 20px',
          backgroundColor: '#faf8f5',
          color: '#111827',
          fontFamily:
            "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
          lineHeight: 1.6,
          WebkitTextSizeAdjust: '100%',
        }}
      >
        <main
          style={{
            width: '100%',
            maxWidth: '640px',
            backgroundColor: '#ffffff',
            border: '1px solid #e5e0d8',
            borderRadius: '16px',
            padding: '40px 28px',
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: '12px',
              fontWeight: 600,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: '#028090',
            }}
          >
            Gangguan sementara
          </p>

          <h1
            style={{
              margin: '20px 0 0',
              fontSize: 'clamp(1.75rem, 1.4rem + 1.6vw, 2.5rem)',
              lineHeight: 1.2,
              letterSpacing: '-0.02em',
              fontWeight: 700,
              color: '#091e3a',
            }}
          >
            Terjadi kesalahan
          </h1>

          <p
            style={{
              margin: '16px 0 0',
              fontSize: '16px',
              color: '#4b5563',
            }}
          >
            Aplikasi Jagatirta gagal dimuat sepenuhnya. Data pemantauan sungai
            Anda tetap aman dan tidak ada laporan yang hilang.
          </p>

          <p
            style={{
              margin: '12px 0 0',
              fontSize: '16px',
              color: '#4b5563',
            }}
          >
            Silakan muat ulang halaman. Bila masalah berlanjut, hubungi kami di{' '}
            <a
              href="mailto:halo@jagatirta.id"
              style={{ color: '#028090', fontWeight: 600 }}
            >
              halo@jagatirta.id
            </a>
            .
          </p>

          <div style={{ marginTop: '32px' }}>
            {/*
             * Tombol asli (bukan komponen bersama) agar halaman darurat tidak
             * bergantung pada CSS yang mungkin sedang gagal dimuat. Tinggi 48px
             * dan cincin fokus dibuat inline untuk menjaga target sentuh a11y.
             */}
            <button
              type="button"
              onClick={() => reset()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '48px',
                minWidth: '48px',
                padding: '0 28px',
                border: 'none',
                borderRadius: '12px',
                backgroundColor: '#028090',
                color: '#ffffff',
                fontSize: '16px',
                fontWeight: 600,
                fontFamily: 'inherit',
                cursor: 'pointer',
              }}
            >
              Coba lagi
            </button>
          </div>

          {error.digest ? (
            <p
              style={{
                margin: '28px 0 0',
                fontSize: '14px',
                color: '#4b5563',
              }}
            >
              Kode galat untuk laporan:{' '}
              <code
                style={{
                  backgroundColor: '#ccfbf1',
                  color: '#091e3a',
                  borderRadius: '6px',
                  padding: '2px 8px',
                  fontFamily:
                    "ui-monospace, SFMono-Regular, Menlo, monospace",
                  fontSize: '12px',
                }}
              >
                {error.digest}
              </code>
            </p>
          ) : null}
        </main>
      </body>
    </html>
  );
}
