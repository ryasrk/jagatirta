import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { Footer, Header } from '@repo/ui';
import '@repo/ui/styles/globals.css';
import 'leaflet/dist/leaflet.css';

const display = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const body = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const siteTitle = 'Jagatirta — River Watch Indonesia';
const siteDescription =
  'Menjaga dan memulihkan tujuh sungai besar Indonesia melalui sains warga.';

export const metadata: Metadata = {
  metadataBase: new URL('https://jagatirta.id'),
  title: {
    default: siteTitle,
    template: '%s | Jagatirta',
  },
  description: siteDescription,
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    siteName: 'Jagatirta',
    title: siteTitle,
    description: siteDescription,
    url: 'https://jagatirta.id',
  },
  twitter: {
    card: 'summary_large_image',
    title: siteTitle,
    description: siteDescription,
  },
  robots: {
    index: true,
    follow: true,
  },
};

const navItems = [
  { label: 'Beranda', href: '/' },
  { label: 'Program', href: '/program' },
  { label: 'Lokasi', href: '/lokasi' },
  { label: 'Relawan', href: '/volunteer' },
  { label: 'Kampanye', href: '/campaign' },
  { label: 'Lapor', href: '/lapor' },
];

const footerColumns = [
  {
    title: 'Jelajahi',
    links: [
      { label: 'Program', href: '/program' },
      { label: 'Lokasi Pemantauan', href: '/lokasi' },
      { label: 'Kampanye', href: '/campaign' },
    ],
  },
  {
    title: 'Terlibat',
    links: [
      { label: 'Jadi Water Ranger', href: '/volunteer' },
      { label: 'Laporkan Pencemaran', href: '/lapor' },
    ],
  },
  {
    title: 'Tujuh Sungai',
    links: [
      { label: 'Cisadane', href: '/lokasi/cisadane' },
      { label: 'Citarum', href: '/lokasi/citarum' },
      { label: 'Brantas', href: '/lokasi/brantas' },
      { label: 'Mahakam', href: '/lokasi/mahakam' },
    ],
  },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${display.variable} ${body.variable} theme-jagatirta`}>
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <Header
          brandName="Jagatirta"
          navItems={navItems}
          ctaLabel="Jadi Water Ranger"
          ctaHref="/volunteer"
        />
        <main className="flex-1">{children}</main>
        <Footer
          brandName="Jagatirta — River Watch Indonesia"
          tagline="Menjaga dan memulihkan tujuh urat nadi sungai Indonesia melalui sains warga dan data yang terbuka untuk semua."
          columns={footerColumns}
          contact={{ email: 'halo@jagatirta.id' }}
        />
      </body>
    </html>
  );
}
