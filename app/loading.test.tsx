import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import Loading from './loading';

/**
 * Keadaan memuat tingkat segmen Jagatirta (app/loading.tsx).
 *
 * Server Component murni: kontrak utamanya adalah status a11y (`role="status"`,
 * `aria-live`, `aria-busy`) plus teks tersembunyi "Memuat halaman…", sementara
 * kerangka visual ditandai `aria-hidden` agar tidak dibacakan pembaca layar.
 */
describe('Loading (Jagatirta, segmen)', () => {
  it('mengumumkan status pemuatan ke pembaca layar', () => {
    render(<Loading />);

    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status).toHaveAttribute('aria-busy', 'true');
  });

  it('menyediakan teks alternatif "Memuat halaman…" untuk pembaca layar', () => {
    render(<Loading />);

    // Teks ini adalah satu-satunya isi status yang terlihat a11y; keberadaannya
    // yang membuat pembaca layar mengumumkan proses pemuatan.
    expect(screen.getByText('Memuat halaman…')).toBeInTheDocument();
  });

  it('menyembunyikan kerangka visual dari pohon aksesibilitas', () => {
    const { container } = render(<Loading />);

    const kerangka = container.querySelector('[aria-hidden="true"]');
    expect(kerangka).not.toBeNull();
    // Kerangka tidak memuat teks sama sekali — hanya placeholder, bukan informasi palsu.
    expect(kerangka?.textContent).toBe('');
  });

  it('menampilkan tepat satu kerangka dengan tiga kartu placeholder', () => {
    const { container } = render(<Loading />);

    const kerangka = container.querySelector('[aria-hidden="true"]');
    expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(1);
    expect(kerangka).not.toBeNull();

    // Struktur: kerangka → (blok judul…, grid) → 3 kartu.
    const grid = kerangka?.lastElementChild as HTMLElement | null;
    expect(grid).not.toBeNull();

    const kolom = grid ? Array.from(grid.children) : [];
    expect(kolom).toHaveLength(3);
    // Setiap kartu hanya berisi blok kosong, tanpa label yang menyesatkan.
    kolom.forEach((kartu) => {
      expect(kartu.textContent).toBe('');
      expect(kartu.children.length).toBeGreaterThan(0);
    });
  });

  it('tidak menampilkan pesan galat atau data palsu saat memuat', () => {
    render(<Loading />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    // Isi teks status hanya kalimat pemuatan, bukan judul/konten halaman.
    expect(screen.getByRole('status').textContent?.trim()).toBe('Memuat halaman…');
  });
});
