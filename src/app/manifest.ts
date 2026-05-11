import type { MetadataRoute } from 'next';
import { manifestIconUrl, SEO } from '@/modules/seo/client/helpers/social-card';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SEO.siteName,
    short_name: 'StreamMgr',
    description: 'Gestion des abonnements streaming',
    start_url: '/',
    display: 'standalone',
    background_color: SEO.bgColor,
    theme_color: SEO.bgColor,
    icons: [
      { src: manifestIconUrl('SM', '192'), sizes: '192x192', type: 'image/png' },
      { src: manifestIconUrl('SM', '512'), sizes: '512x512', type: 'image/png' },
    ],
  };
}
