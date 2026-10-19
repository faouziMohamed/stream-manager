import { Encryptor } from '@/server/common/security/encryptor';

// 32-byte key as 64 hex chars (AES-256).
const KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
const OTHER_KEY = 'fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210';

describe('Encryptor', () => {
  const enc = new Encryptor(KEY);

  it('round-trips plain text', () => {
    expect(enc.decrypt(enc.encrypt('hunter2'))).toBe('hunter2');
  });

  it('round-trips an empty string', () => {
    expect(enc.decrypt(enc.encrypt(''))).toBe('');
  });

  it('round-trips unicode and emoji', () => {
    const value = 'pâté 🔐 日本語';
    expect(enc.decrypt(enc.encrypt(value))).toBe(value);
  });

  it('round-trips a long payload', () => {
    const value = 'x'.repeat(10_000);
    expect(enc.decrypt(enc.encrypt(value))).toBe(value);
  });

  it('produces iv:authTag:ciphertext hex segments', () => {
    const parts = enc.encrypt('value').split(':');
    expect(parts).toHaveLength(3);
    expect(parts[0]).toMatch(/^[\da-f]{32}$/); // 16-byte IV
    expect(parts[1]).toMatch(/^[\da-f]{32}$/); // 16-byte auth tag
    expect(parts[2]).toMatch(/^[\da-f]+$/);
  });

  it('uses a random IV so ciphertexts differ but decrypt to the same value', () => {
    const a = enc.encrypt('same');
    const b = enc.encrypt('same');
    expect(a).not.toBe(b);
    expect(enc.decrypt(a)).toBe('same');
    expect(enc.decrypt(b)).toBe('same');
  });

  it('rejects a tampered ciphertext (auth tag mismatch)', () => {
    const [iv, tag, cipher] = enc.encrypt('secret').split(':');
    const flipped = cipher.slice(0, -1) + (cipher.at(-1) === '0' ? '1' : '0');
    expect(() => enc.decrypt(`${iv}:${tag}:${flipped}`)).toThrow();
  });

  it('rejects a tampered auth tag', () => {
    const [iv, tag, cipher] = enc.encrypt('secret').split(':');
    const flipped = tag.slice(0, -1) + (tag.at(-1) === '0' ? '1' : '0');
    expect(() => enc.decrypt(`${iv}:${flipped}:${cipher}`)).toThrow();
  });

  it('rejects decryption with the wrong key', () => {
    const payload = enc.encrypt('secret');
    expect(() => new Encryptor(OTHER_KEY).decrypt(payload)).toThrow();
  });

  it('throws a clear error for malformed payloads', () => {
    expect(() => enc.decrypt('not-a-valid-payload')).toThrow('Invalid encrypted payload');
    expect(() => enc.decrypt('onlyonesegment:two')).toThrow('Invalid encrypted payload');
  });
});
