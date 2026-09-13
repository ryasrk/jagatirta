import { ImageResponse } from 'next/og';

export const alt =
  'Jagatirta — River Watch Indonesia: sains warga dan data terbuka untuk tujuh sungai Indonesia.';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';
export const runtime = 'edge';

const TAGLINE =
  'Menjaga dan memulihkan tujuh urat nadi sungai Indonesia melalui sains warga dan data terbuka.';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#F8FAFC',
          padding: '72px 80px',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 20,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 72,
              height: 72,
              borderRadius: 20,
              backgroundColor: '#0F766E',
              color: '#F8FAFC',
              fontSize: 44,
              fontWeight: 700,
            }}
          >
            J
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 28,
              fontWeight: 600,
              letterSpacing: 4,
              textTransform: 'uppercase',
              color: '#0F766E',
            }}
          >
            River Watch Indonesia
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          <div
            style={{
              display: 'flex',
              fontSize: 132,
              fontWeight: 700,
              lineHeight: 1,
              letterSpacing: -4,
              color: '#0F172A',
            }}
          >
            Jagatirta
          </div>
          <div
            style={{
              display: 'flex',
              maxWidth: 940,
              fontSize: 36,
              lineHeight: 1.35,
              color: '#334155',
            }}
          >
            {TAGLINE}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '3px solid #0F766E',
            paddingTop: 28,
            fontSize: 26,
            color: '#0F766E',
          }}
        >
          <div style={{ display: 'flex', fontWeight: 600 }}>
            Sains warga · Data terbuka · Tujuh sungai
          </div>
          <div style={{ display: 'flex' }}>jagatirta.id</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
