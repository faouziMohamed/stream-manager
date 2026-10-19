import { ImageResponse } from 'next/og';

const BACKGROUND = '#0a0a0a';
const ACCENT = '#e94e4e';
const FOREGROUND = '#f5f5f5';
const MUTED = '#9a9a9a';

/**
 * The brand card used by the Open Graph and Twitter images.
 *
 * The old frontend called an external `social-card-sdk` service for this; the
 * image is one dark rectangle with the wordmark, so Next's built-in
 * `ImageResponse` generates it at the edge with no extra dependency.
 */
export function brandImage({
  height,
  title,
  subtitle,
  width,
}: {
  height: number;
  subtitle?: string;
  title: string;
  width: number;
}) {
  const compact = width < 400;
  const markSize = compact ? 96 : 120;

  return new ImageResponse(
    <div
      style={{
        alignItems: 'flex-start',
        backgroundColor: BACKGROUND,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        justifyContent: 'space-between',
        padding: compact ? 24 : 72,
        width: '100%',
      }}
    >
      <div style={{ alignItems: 'center', display: 'flex', gap: compact ? 16 : 24 }}>
        <div
          style={{
            alignItems: 'center',
            backgroundColor: ACCENT,
            borderRadius: compact ? 20 : 28,
            color: BACKGROUND,
            display: 'flex',
            fontSize: markSize * 0.36,
            fontWeight: 700,
            height: markSize,
            justifyContent: 'center',
            width: markSize,
          }}
        >
          SM
        </div>
        <div
          style={{
            color: FOREGROUND,
            display: 'flex',
            fontSize: compact ? 28 : 40,
            fontWeight: 600,
          }}
        >
          StreamManager
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? 10 : 20 }}>
        <div
          style={{
            color: FOREGROUND,
            display: 'flex',
            fontSize: compact ? 28 : 64,
            fontWeight: 700,
            lineHeight: 1.1,
            maxWidth: '100%',
          }}
        >
          {title}
        </div>
        {subtitle === undefined ? null : (
          <div
            style={{
              color: MUTED,
              display: 'flex',
              fontSize: compact ? 16 : 28,
              lineHeight: 1.3,
              maxWidth: '85%',
            }}
          >
            {subtitle}
          </div>
        )}
      </div>

      <div
        style={{
          backgroundColor: ACCENT,
          borderRadius: 999,
          display: 'flex',
          height: 8,
          width: compact ? 80 : 160,
        }}
      />
    </div>,
    { height, width }
  );
}
