import type { MetadataRoute } from 'next';

import { env } from '@/lib/settings/env';

const siteUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, '');

/**
 * The public surface is one redirecting home page; everything useful lives
 * behind sign-in. Crawlers are allowed to reach the brand shell and told to
 * stay out of the console, the API and the account flows.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/console',
          '/api/',
          '/forbidden',
          '/login',
          '/register',
          '/forgot-password',
          '/reset-password',
          '/verify-email',
          '/pending-approval',
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
