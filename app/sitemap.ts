import type { MetadataRoute } from 'next';

import { rivers } from '@repo/data';

const BASE_URL = 'https://jagatirta.id';

type ChangeFrequency = MetadataRoute.Sitemap[number]['changeFrequency'];

/** Halaman statis Jagatirta beserta bobot prioritasnya. */
/**
 * Halaman statis Jagatirta beserta bobot prioritasnya.
 *
 * Detail per sungai TIDAK didaftarkan di sini: daftar itu dibangkitkan dari
 * `rivers` di bawah. Menuliskannya manual akan menghasilkan dua entri untuk URL
 * yang sama, dan sitemap berisi duplikat membuat mesin pencari menilai situs
 * tidak dapat dipercaya.
 */
const staticRoutes: ReadonlyArray<{
  path: string;
  changeFrequency: ChangeFrequency;
  priority: number;
}> = [
  { path: '/', changeFrequency: 'daily', priority: 1 },
  { path: '/program', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/lokasi', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/volunteer', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/campaign', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/lapor', changeFrequency: 'monthly', priority: 0.8 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  // `new Date()` dipakai sebagai penanda pembaruan agar setiap build
  // menghasilkan lastModified yang segar.
  const lastModified = new Date();

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${BASE_URL}${route.path}`,
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  // Detail lokasi pemantauan sungai Jagatirta.
  const riverEntries: MetadataRoute.Sitemap = rivers.map((river) => ({
    url: `${BASE_URL}/lokasi/${river.slug}`,
    lastModified,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  return [...staticEntries, ...riverEntries];
}
