import { ImageResponse } from 'next/og';

export const contentType = 'image/png';
export const size = { height: 180, width: 180 };

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        alignItems: 'center',
        backgroundColor: '#0a0a0a',
        display: 'flex',
        height: '100%',
        justifyContent: 'center',
        width: '100%',
      }}
    >
      <div
        style={{
          alignItems: 'center',
          backgroundColor: '#e94e4e',
          borderRadius: 32,
          color: '#0a0a0a',
          display: 'flex',
          fontSize: 46,
          fontWeight: 700,
          height: 128,
          justifyContent: 'center',
          width: 128,
        }}
      >
        SM
      </div>
    </div>,
    { height: size.height, width: size.width }
  );
}
