import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    background_color: '#0a0a0a',
    description: 'Operations console for streaming-subscription resellers.',
    display: 'standalone',
    icons: [
      {
        sizes: 'any',
        src: '/icon.svg',
        type: 'image/svg+xml',
      },
      {
        sizes: '180x180',
        src: '/apple-icon',
        type: 'image/png',
      },
    ],
    name: 'StreamManager',
    short_name: 'StreamManager',
    start_url: '/console',
    theme_color: '#0a0a0a',
  };
}
