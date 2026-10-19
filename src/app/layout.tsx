import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Geist, Geist_Mono } from 'next/font/google';

import { AppProviders } from '@/components/shared/providers/app-providers';
import { JsonLd } from '@/lib/seo/json-ld';
import { env } from '@/lib/settings/env';

import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const SITE_URL = env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, '');
const SITE_DESCRIPTION =
  'Customers, memberships, payments and streaming accounts in one operations console for subscription resellers.';

export const metadata: Metadata = {
  alternates: { canonical: '/' },
  applicationName: 'StreamManager',
  description: SITE_DESCRIPTION,
  manifest: '/manifest.webmanifest',
  metadataBase: new URL(SITE_URL),
  openGraph: {
    description: SITE_DESCRIPTION,
    locale: 'en_US',
    siteName: 'StreamManager',
    title: 'StreamManager — streaming subscription operations',
    type: 'website',
    url: SITE_URL,
  },
  other: {
    'msapplication-TileColor': '#0a0a0a',
    'theme-color': '#0a0a0a',
  },
  title: {
    default: 'StreamManager — streaming subscription operations',
    template: '%s | StreamManager',
  },
  twitter: {
    card: 'summary_large_image',
    description: SITE_DESCRIPTION,
    title: 'StreamManager — streaming subscription operations',
  },
};

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  description: SITE_DESCRIPTION,
  logo: `${SITE_URL}/icon.svg`,
  name: 'StreamManager',
  url: SITE_URL,
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'StreamManager',
  url: SITE_URL,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      {/* Browser extensions (Grammarly and similar) inject attributes on <body> before hydration. */}
      <body className="flex min-h-full flex-col" suppressHydrationWarning>
        <JsonLd data={organizationJsonLd} />
        <JsonLd data={websiteJsonLd} />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
