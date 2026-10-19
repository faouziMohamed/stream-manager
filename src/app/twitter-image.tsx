import { brandImage } from '@/lib/seo/social-card';

export const alt = 'StreamManager — streaming subscription operations console';
export const contentType = 'image/png';
export const size = { height: 630, width: 1200 };

export default function TwitterImage() {
  return brandImage({
    height: size.height,
    subtitle: 'Customers, memberships, payments and streaming accounts — one operations console.',
    title: 'Streaming subscription operations, under control.',
    width: size.width,
  });
}
