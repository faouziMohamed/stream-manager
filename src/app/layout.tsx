import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { Geist_Mono, Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/shared/providers';
import { cn } from '@/lib/utils';
import { env } from '@/lib/settings/env';
import { Analytics } from '@vercel/analytics/next';
import { JsonLd } from '@/modules/seo/client/components/json-ld';
import {
  appleTouchIconUrl,
  faviconUrl,
  ogImageUrl,
  SEO,
} from '@/modules/seo/client/helpers/social-card';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['300', '400', '500', '600', '700', '800'],
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['500', '600', '700'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const SITE_URL = env.NEXT_PUBLIC_URL;
const DEFAULT_OG = ogImageUrl(
  'StreamManager — Gestion des abonnements streaming',
  'Gérez, suivez et renouvelez vos abonnements Netflix, Disney+, Spotify et plus encore au meilleur prix.',
  SEO.siteName
);

export const metadata: Metadata = {
  title: {
    default: 'StreamManager — Gestion des abonnements',
    template: '%s — StreamManager',
  },
  description:
    'Gérez, suivez et renouvelez vos abonnements Netflix, Disney+, Spotify et plus encore au meilleur prix.',
  metadataBase: new URL(SITE_URL),
  manifest: '/manifest.webmanifest',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: SEO.siteName,
    url: SITE_URL,
    title: 'StreamManager — Gestion des abonnements streaming',
    description:
      'Gérez, suivez et renouvelez vos abonnements Netflix, Disney+, Spotify et plus encore au meilleur prix.',
    images: [{ url: DEFAULT_OG, width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'StreamManager — Gestion des abonnements streaming',
    description:
      'Gérez, suivez et renouvelez vos abonnements Netflix, Disney+, Spotify et plus encore au meilleur prix.',
    images: [DEFAULT_OG],
  },
  icons: {
    icon: faviconUrl('SM'),
    apple: appleTouchIconUrl('SM'),
    shortcut: faviconUrl('SM'),
  },
  other: {
    'msapplication-TileColor': SEO.bgColor,
    'theme-color': SEO.bgColor,
  },
};

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SEO.siteName,
  url: SITE_URL,
  logo: faviconUrl('SM'),
  description:
    "Service de gestion d'abonnements streaming au Maroc — Netflix, Disney+, Spotify, et plus.",
  address: {
    '@type': 'PostalAddress',
    addressCountry: 'MA',
  },
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SEO.siteName,
  url: SITE_URL,
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${SITE_URL}/?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={cn('font-sans', inter.variable, spaceGrotesk.variable)}
    >
      <body className={`${geistMono.variable} antialiased`}>
        <JsonLd data={organizationJsonLd} />
        <JsonLd data={websiteJsonLd} />
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
