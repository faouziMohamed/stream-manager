/**
 * AES-256-GCM symmetric encryption for sensitive fields (profile pins, etc.)
 * Key: 32-byte hex string from ENCRYPTION_KEY env var.
 * Output format: `<iv_hex>:<authTag_hex>:<ciphertext_hex>` — stored as a single text column.
 * Server-side only — never import this in client components.
 */
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { env } from "@/lib/settings/env";

const ALGO = "aes-256-gcm";

function getKey(): Buffer {
  return Buffer.from(env.ENCRYPTION_KEY, "hex");
}

/**
 * Encrypt a plaintext string.
 * Returns a colon-delimited string: `iv:authTag:ciphertext` (all hex).
 */
export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(12); // 96-bit IV recommended for GCM
  const cipher = createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

/**
 * Decrypt a value produced by `encrypt()`.
 * Returns the original plaintext string, or null if the value is null/empty.
 */
export function decrypt(stored: string | null | undefined): string | null {
  if (!stored) return null;
  const parts = stored.split(":");
  if (parts.length !== 3) return null;
  const [ivHex, authTagHex, ciphertextHex] = parts;
  try {
    const key = getKey();
    const decipher = createDecipheriv(ALGO, key, Buffer.from(ivHex!, "hex"));
    decipher.setAuthTag(Buffer.from(authTagHex!, "hex"));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(ciphertextHex!, "hex")),
      decipher.final(),
    ]);
    return decrypted.toString("utf8");
  } catch {
    return null;
  }
}
