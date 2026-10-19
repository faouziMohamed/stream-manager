import { sniffMimeType } from '@/server/common/utils/mime-sniff';

function bytes(...values: number[]): Buffer {
  return Buffer.from(values);
}

function ascii(text: string, length = text.length): Buffer {
  const buffer = Buffer.alloc(length);
  buffer.write(text, 'ascii');
  return buffer;
}

describe('sniffMimeType', () => {
  it('detects JPEG magic bytes', () => {
    expect(sniffMimeType(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe('image/jpeg');
  });

  it('detects PNG magic bytes', () => {
    expect(sniffMimeType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a))).toBe('image/png');
  });

  it('detects GIF magic bytes', () => {
    expect(sniffMimeType(bytes(0x47, 0x49, 0x46, 0x38, 0x39, 0x61))).toBe('image/gif');
  });

  it('detects WEBP (RIFF....WEBP)', () => {
    const buffer = ascii('RIFF', 12);
    buffer.write('WEBP', 8, 'ascii');
    expect(sniffMimeType(buffer)).toBe('image/webp');
  });

  it('detects AVIF (....ftypavif)', () => {
    const buffer = Buffer.alloc(12);
    buffer.write('ftyp', 4, 'ascii');
    buffer.write('avif', 8, 'ascii');
    expect(sniffMimeType(buffer)).toBe('image/avif');
  });

  it('returns null for buffers shorter than 4 bytes', () => {
    expect(sniffMimeType(bytes(0xff, 0xd8))).toBeNull();
    expect(sniffMimeType(Buffer.alloc(0))).toBeNull();
  });

  it('returns null for unknown magic bytes', () => {
    expect(sniffMimeType(bytes(0x00, 0x01, 0x02, 0x03, 0x04))).toBeNull();
  });

  it('returns null for RIFF containers that are not WEBP (e.g. WAV)', () => {
    const buffer = ascii('RIFF', 12);
    buffer.write('WAVE', 8, 'ascii');
    expect(sniffMimeType(buffer)).toBeNull();
  });

  it('returns null for ftyp containers that are not AVIF (e.g. MP4)', () => {
    const buffer = Buffer.alloc(12);
    buffer.write('ftyp', 4, 'ascii');
    buffer.write('mp42', 8, 'ascii');
    expect(sniffMimeType(buffer)).toBeNull();
  });

  it('returns null for a truncated RIFF header (length < 12)', () => {
    expect(sniffMimeType(ascii('RIFF', 8))).toBeNull();
  });
});
