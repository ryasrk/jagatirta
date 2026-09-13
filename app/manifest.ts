import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Jagatirta — River Watch Indonesia',
    short_name: 'Jagatirta',
    description:
      'Menjaga dan memulihkan tujuh urat nadi sungai Indonesia melalui sains warga dan data terbuka.',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#F8FAFC',
    theme_color: '#0F766E',
    lang: 'id',
    categories: ['education', 'government', 'social', 'utilities'],
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
