import crypto from 'node:crypto';

export interface IEncryptor {
  decrypt(text: string): string;
  encrypt(text: string): string;
}

export class Encryptor implements IEncryptor {
  private readonly secret: string;

  public constructor(secret: string) {
    this.secret = secret;
  }

  public encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(this.secret, 'hex'), iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
  }

  public decrypt(text: string): string {
    const [ivHex, authTagHex, encryptedHex] = text.split(':');

    if (ivHex === undefined || authTagHex === undefined || encryptedHex === undefined) {
      throw new Error('Invalid encrypted payload');
    }

    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      Buffer.from(this.secret, 'hex'),
      Buffer.from(ivHex, 'hex')
    );

    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));

    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptedHex, 'hex')),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  }
}
