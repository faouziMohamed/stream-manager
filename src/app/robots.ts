import type { MetadataRoute } from 'next';
import { env } from '@/lib/settings/env';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = env.NEXT_PUBLIC_URL.replace(/\/+$/, '');

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: '/console',
      },
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/auth/'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
