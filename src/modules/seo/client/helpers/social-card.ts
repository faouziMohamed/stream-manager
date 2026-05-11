import { SocialCardClient } from 'social-card-sdk';
import { env } from '@/lib/settings/env';

export const SEO = {
  siteName: 'StreamManager',
  accentColor: '#e94e4e',
  bgColor: '#0a0a0a',
} as const;

let client: SocialCardClient | null = null;

export function getSocialCardClient(): SocialCardClient {
  if (!client) {
    client = new SocialCardClient({
      baseUrl: env.SOCIAL_CARD_BASE_URL,
      defaultTheme: 'dark',
      defaultAccentColor: SEO.accentColor,
    });
  }
  return client;
}

export function ogImageUrl(title: string, description?: string, siteName?: string): string {
  const c = getSocialCardClient();
  return c.og.general({
    title,
    description,
    siteName: siteName ?? SEO.siteName,
    accentColor: SEO.accentColor,
  });
}

export function faviconUrl(initial: string, color?: string): string {
  const c = getSocialCardClient();
  return c.seo.favicon({
    initial,
    color: color ?? SEO.bgColor,
    accentColor: SEO.accentColor,
    shape: 'rounded',
  });
}

export function appleTouchIconUrl(initial: string): string {
  const c = getSocialCardClient();
  return c.seo.appleTouchIcon({
    initial,
    color: SEO.bgColor,
    accentColor: SEO.accentColor,
    shape: 'rounded',
  });
}

export function manifestIconUrl(initial: string, size: '192' | '512' = '192'): string {
  const c = getSocialCardClient();
  return c.seo.manifestIcon({
    initial,
    color: SEO.bgColor,
    accentColor: SEO.accentColor,
    shape: 'rounded',
    size,
  });
}
