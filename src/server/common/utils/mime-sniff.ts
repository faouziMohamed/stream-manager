export const allowedAssetMimeTypes = [
  'image/avif',
  'image/gif',
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export type AllowedAssetMimeType = (typeof allowedAssetMimeTypes)[number];

export function sniffMimeType(buffer: Buffer): AllowedAssetMimeType | null {
  if (buffer.length < 4) {
    return null;
  }

  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return 'image/png';
  }

  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
    return 'image/gif';
  }

  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'image/webp';
  }

  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 4, 8) === 'ftyp' &&
    buffer.toString('ascii', 8, 12) === 'avif'
  ) {
    return 'image/avif';
  }

  return null;
}
