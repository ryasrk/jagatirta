import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Diimpor dengan nama lain: nama `Error` akan membayangi konstruktor global
// `Error`, sehingga `new Error(...)` di dalam test memanggil komponen, bukan galat.
import ErrorSegment from './error';

/**
 * Batas galat tingkat segmen Jagatirta (app/error.tsx).
 *
 * Kontrak penting: mencatat galat ke konsol sekali per galat, menyediakan tombol
 * pulih "Coba lagi" yang memanggil `reset`, tautan beranda, dan hanya menampilkan
 * kode `digest` bila ada.
 */
describe('Error (Jagatirta, segmen)', () => {
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  it('menampilkan judul, penjelasan, dan jaminan data sungai tetap aman', () => {
    render(<ErrorSegment error={new Error('gagal memuat')} reset={vi.fn()} />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Terjadi kesalahan' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Gangguan sementara')).toBeInTheDocument();
    expect(
      screen.getByText(/Kami tidak berhasil memuat bagian ini/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Data sungai Anda tetap aman/i),
    ).toBeInTheDocument();
  });

  it('mencatat galat ke konsol melalui useEffect', () => {
    const galat = new Error('gagal memuat');
    render(<ErrorSegment error={galat} reset={vi.fn()} />);

    expect(consoleError).toHaveBeenCalledTimes(1);
    expect(consoleError).toHaveBeenCalledWith(galat);
  });

  it('menyediakan tautan surel ke halo@jagatirta.id', () => {
    render(<ErrorSegment error={new Error('x')} reset={vi.fn()} />);

    expect(
      screen.getByRole('link', { name: 'halo@jagatirta.id' }),
    ).toHaveAttribute('href', 'mailto:halo@jagatirta.id');
  });

  it('memanggil reset saat tombol "Coba lagi" diklik', async () => {
    const reset = vi.fn();
    const user = userEvent.setup();
    render(<ErrorSegment error={new Error('x')} reset={reset} />);

    const tombol = screen.getByRole('button', { name: 'Coba lagi' });
    expect(tombol).toHaveAttribute('type', 'button');

    await user.click(tombol);

    expect(reset).toHaveBeenCalledTimes(1);
  });

  it('menautkan tombol "Kembali ke Beranda" ke rute /', () => {
    render(<ErrorSegment error={new Error('x')} reset={vi.fn()} />);

    expect(
      screen.getByRole('link', { name: 'Kembali ke Beranda' }),
    ).toHaveAttribute('href', '/');
  });

  it('tidak menampilkan kode galat saat digest tidak ada', () => {
    render(<ErrorSegment error={new Error('x')} reset={vi.fn()} />);

    expect(screen.queryByText(/Kode galat untuk laporan/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Kode galat/i)).not.toBeInTheDocument();
  });

  it('menampilkan kode galat apa adanya saat digest tersedia', () => {
    const error = Object.assign(new Error('x'), { digest: 'abc123def' });
    render(<ErrorSegment error={error} reset={vi.fn()} />);

    expect(screen.getByText('Kode galat untuk laporan:')).toBeInTheDocument();
    const kode = screen.getByText('abc123def');
    expect(kode.tagName).toBe('CODE');
  });
});
