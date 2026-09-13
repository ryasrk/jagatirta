import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import GlobalError from './global-error';

/**
 * Batas galat akar Jagatirta (app/global-error.tsx).
 *
 * Karena Next.js mengganti seluruh dokumen saat galat terjadi di root layout,
 * komponen ini harus merender <html> dan <body> sendiri dengan bahasa `id`.
 */
describe('GlobalError (Jagatirta, root)', () => {
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Komponen ini memang memanggil console.error(error); spy membuat pemanggilan
    // itu terverifikasi tanpa membanjiri keluaran tes.
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  it('merender dokumen html berbahasa Indonesia dengan tema Jagatirta', () => {
    const { container } = render(<GlobalError error={new Error('x')} reset={vi.fn()} />);

    // Next.js mengganti seluruh dokumen, jadi komponen ini merender <html>/<body>
    // sendiri; RTL menaruhnya di dalam container, bukan di documentElement jsdom.
    const html = container.querySelector('html');
    expect(html).not.toBeNull();
    expect(html).toHaveAttribute('lang', 'id');
    expect(html).toHaveClass('theme-jagatirta');
    expect(html?.querySelector('body')).not.toBeNull();
  });

  it('menampilkan peringatan darurat dan jaminan data pemantauan', () => {
    render(<GlobalError error={new Error('x')} reset={vi.fn()} />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Terjadi kesalahan' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Gangguan sementara')).toBeInTheDocument();
    expect(
      screen.getByText(/Aplikasi Jagatirta gagal dimuat sepenuhnya/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Data pemantauan sungai Anda tetap aman/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'halo@jagatirta.id' }),
    ).toHaveAttribute('href', 'mailto:halo@jagatirta.id');
  });

  it('mencatat galat ke konsol melalui useEffect', () => {
    const galat = new Error('root gagal');
    render(<GlobalError error={galat} reset={vi.fn()} />);

    expect(consoleError).toHaveBeenCalledWith(galat);
  });

  it('memanggil reset saat tombol pemulihan diklik', async () => {
    const reset = vi.fn();
    const user = userEvent.setup();
    render(<GlobalError error={new Error('x')} reset={reset} />);

    // Halaman darurat memakai <button> asli tanpa dependensi paket UI.
    const tombol = screen.getByRole('button', { name: 'Coba lagi' });
    expect(tombol.tagName).toBe('BUTTON');
    expect(tombol).toHaveAttribute('type', 'button');

    await user.click(tombol);

    expect(reset).toHaveBeenCalledTimes(1);
  });

  it('tidak menampilkan kode galat saat digest tidak ada', () => {
    render(<GlobalError error={new Error('x')} reset={vi.fn()} />);

    expect(screen.queryByText(/Kode galat untuk laporan/i)).not.toBeInTheDocument();
  });

  it('menampilkan kode galat saat digest tersedia', () => {
    const error = Object.assign(new Error('x'), { digest: 'digest-9f8e' });
    render(<GlobalError error={error} reset={vi.fn()} />);

    expect(screen.getByText('Kode galat untuk laporan:')).toBeInTheDocument();
    expect(screen.getByText('digest-9f8e').tagName).toBe('CODE');
  });
});
