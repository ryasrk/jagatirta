import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';

import NotFound from './not-found';

/**
 * Halaman 404 global Jagatirta (app/not-found.tsx).
 *
 * Server Component yang hanya merender tautan statis; kontraknya adalah
 * label judul/latar, milestone `<h1>`, daftar navigasi bantuan berlabel, dan
 * jalur kontak.
 */
describe('NotFound (Jagatirta)', () => {
  it('mengekspor metadata judul "Halaman tidak ditemukan"', async () => {
    const mod = await import('./not-found');
    expect(mod.metadata).toEqual({ title: 'Halaman tidak ditemukan' });
  });

  it('menampilkan judul utama sebagai satu-satunya h1', () => {
    render(<NotFound />);

    const headings = screen.getAllByRole('heading', { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent('Halaman tidak ditemukan');
    expect(headings[0]).toHaveAttribute('id', 'judul-404');
  });

  it('menampilkan label kecil "Galat 404" dan penjelasan alamat tidak tersedia', () => {
    render(<NotFound />);

    expect(screen.getByText('Galat 404')).toBeInTheDocument();
    expect(
      screen.getByText(/Alamat yang Anda buka tidak tersedia/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Silakan pilih salah satu tautan di bawah ini/i),
    ).toBeInTheDocument();
  });

  it('menyediakan navigasi bantuan berlabel dengan tiga tautan beserta keterangannya', () => {
    render(<NotFound />);

    const nav = screen.getByRole('navigation', { name: 'Tautan bantuan' });
    const tautan = within(nav).getAllByRole('link');
    expect(tautan).toHaveLength(3);
    expect(within(nav).getAllByRole('listitem')).toHaveLength(3);

    expect(within(nav).getByRole('link', { name: /Kembali ke Beranda/ })).toHaveAttribute(
      'href',
      '/',
    );
    expect(
      within(nav).getByRole('link', { name: /Lihat Lokasi Pemantauan/ }),
    ).toHaveAttribute('href', '/lokasi');
    expect(
      within(nav).getByRole('link', { name: /Laporkan Pencemaran/ }),
    ).toHaveAttribute('href', '/lapor');
  });

  it('memasangkan setiap label tautan dengan keterangan yang menjelaskan tujuannya', () => {
    render(<NotFound />);

    const nav = screen.getByRole('navigation', { name: 'Tautan bantuan' });
    const kartu = within(nav).getAllByRole('listitem');

    expect(kartu[0]).toHaveTextContent('Ringkasan kondisi sungai dan kabar terbaru.');
    expect(kartu[1]).toHaveTextContent('Tujuh sungai yang kami pantau bersama warga.');
    expect(kartu[2]).toHaveTextContent(
      'Temukan masalah di sungai? Sampaikan ke tim kami.',
    );
  });

  it('menautkan bagian dengan aria-labelledby ke judul 404', () => {
    const { container } = render(<NotFound />);

    const section = container.querySelector('section');
    expect(section).toHaveAttribute('aria-labelledby', 'judul-404');
    expect(screen.getByRole('heading', { level: 1 })).toHaveAttribute('id', 'judul-404');
  });

  it('menyediakan jalur kontak surel halo@jagatirta.id', () => {
    render(<NotFound />);

    const surel = screen.getByRole('link', { name: 'halo@jagatirta.id' });
    expect(surel).toHaveAttribute('href', 'mailto:halo@jagatirta.id');
    expect(screen.getByText(/Butuh bantuan lain\?/i)).toBeInTheDocument();
  });
});
