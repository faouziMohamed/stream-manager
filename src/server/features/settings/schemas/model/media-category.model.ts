export const MEDIA_CATEGORIES = ['LIBRARY', 'SERVICES', 'AVATARS'] as const;

export type MediaCategory = (typeof MEDIA_CATEGORIES)[number];

export const DEFAULT_MEDIA_CATEGORY: MediaCategory = 'LIBRARY';

// Folder segment each category maps to in the storage key.
const CATEGORY_FOLDERS: Record<MediaCategory, string> = {
  AVATARS: 'avatars',
  LIBRARY: 'library',
  SERVICES: 'services',
};

export function mediaCategoryFolder(category: MediaCategory): string {
  return CATEGORY_FOLDERS[category];
}

export function isMediaCategory(value: unknown): value is MediaCategory {
  return typeof value === 'string' && (MEDIA_CATEGORIES as readonly string[]).includes(value);
}
