import { ImageResponse } from 'next/og';

export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';
export const runtime = 'edge';

export default async function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0F766E',
          borderRadius: 8,
          color: '#F8FAFC',
          fontSize: 22,
          fontWeight: 700,
          fontFamily: 'sans-serif',
          lineHeight: 1,
        }}
      >
        J
      </div>
    ),
    { ...size },
  );
}
