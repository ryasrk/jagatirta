import type { Config } from 'tailwindcss';
import plugin from 'tailwindcss/plugin';
import sharedPreset from '@repo/config/tailwind-preset';

/**
 * Utilitas `text-wrap` (`text-balance`) belum ada di Tailwind v3, padahal
 * judul kampanye panjang sangat diuntungkan olehnya. Dipasang lokal di app ini
 * — bukan di preset bersama — supaya paket @repo/* tidak perlu ikut berubah.
 */
const textWrap = plugin(({ addUtilities }) => {
  addUtilities({
    '.text-balance': { textWrap: 'balance' },
    '.text-pretty': { textWrap: 'pretty' },
  });
});

/**
 * Token CSS-variable (`brand.*`, `canvas`, `surface`, `ink`, `editorial`) tidak
 * bisa dibaca Tailwind untuk opasitas: `bg-brand-soft/40` menghasilkan aturan
 * kosong karena nilainya berupa `var(...)` utuh. Padahal `@repo/ui` sendiri
 * memakai bentuk itu (mis. `ring-brand-primary/40`, `placeholder:text-ink-secondary/70`),
 * sehingga opasitasnya diam-diam hilang.
 *
 * Solusinya: timpa token warna yang sama menjadi saluran RGB terpisah
 * (`rgb(var(--x) / <alpha-value>)`). Tidak ada paket yang perlu disentuh, dan
 * kelas tanpa pembagi (`bg-brand-primary`) tetap menghasilkan warna yang sama.
 *
 * Nilai kanal didefinisikan di `app/kampanye.css`, bukan di sini, agar tetap
 * satu tempat dengan tema `.theme-jagatirta`/`.theme-zamroed`.
 */
const theme = {
  extend: {
    colors: {
      brand: {
        deep: 'rgb(var(--brand-deep-rgb) / <alpha-value>)',
        primary: 'rgb(var(--brand-primary-rgb) / <alpha-value>)',
        accent: 'rgb(var(--brand-accent-rgb) / <alpha-value>)',
        soft: 'rgb(var(--brand-soft-rgb) / <alpha-value>)',
      },
      canvas: 'rgb(var(--canvas-rgb) / <alpha-value>)',
      surface: {
        DEFAULT: 'rgb(var(--surface-rgb) / <alpha-value>)',
        pure: 'rgb(var(--surface-pure-rgb) / <alpha-value>)',
      },
      ink: {
        DEFAULT: 'rgb(var(--text-ink-rgb) / <alpha-value>)',
        secondary: 'rgb(var(--text-secondary-rgb) / <alpha-value>)',
      },
      editorial: 'rgb(var(--border-editorial-rgb) / <alpha-value>)',
    },
  },
};

export default {
  presets: [sharedPreset],
  theme,
  plugins: [textWrap],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './packages/*/src/**/*.{ts,tsx}',
    '../../packages/*/src/**/*.{ts,tsx}',
  ],
} satisfies Config;
