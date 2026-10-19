import type { MetadataRoute } from 'next';

import { env } from '@/lib/settings/env';

const siteUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, '');

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      changeFrequency: 'monthly',
      lastModified: new Date(),
      priority: 1,
      url: siteUrl,
    },
  ];
}
