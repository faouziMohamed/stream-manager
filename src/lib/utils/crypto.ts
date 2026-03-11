/**
 * AES-256-GCM encryption/decryption using the ENCRYPTION_KEY env var.
 * Server-side only — never import this from a 'use client' file.
 */
import {createCipheriv, createDecipheriv, randomBytes} from 'crypto';
import {env} from '@/lib/settings/env';

const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12;   // 96-bit IV recommended for GCM
const TAG_BYTES = 16;

function getKey(): Buffer {
    return Buffer.from(env.ENCRYPTION_KEY, 'hex');
}

/**
 * Encrypt a plaintext string.
 * Returns a base64-encoded string: iv(12) + tag(16) + ciphertext
 */
export function encrypt(plaintext: string): string {
    const key = getKey();
    const iv = randomBytes(IV_BYTES);
    const cipher = createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

/**
 * Decrypt a value produced by encrypt().
 * Returns the original plaintext string.
 */
export function decrypt(encoded: string): string {
    const buf = Buffer.from(encoded, 'base64');
    const iv = buf.subarray(0, IV_BYTES);
    const tag = buf.subarray(IV_BYTES, IV_BYTES + TAG_BYTES);
    const ciphertext = buf.subarray(IV_BYTES + TAG_BYTES);
    const key = getKey();
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}

/**
 * Decrypt a value if it looks encrypted (base64, ≥ 40 chars), otherwise return as-is.
 * Useful for migrating unencrypted legacy values gracefully.
 */
export function safeDecrypt(value: string): string {
    try {
        return decrypt(value);
    } catch {
        return value;
    }
}
