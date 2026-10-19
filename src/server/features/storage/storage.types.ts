export interface StorageObjectUploadInput {
  contentType: string;
  data: Buffer;
  key: string;
}

export interface StorageProvider {
  deleteObject(key: string): Promise<void>;
  downloadObject(key: string): Promise<Buffer>;
  getPresignedUrl(key: string, ttlSeconds: number): Promise<string>;
  listObjects(prefix: string): Promise<string[]>;
  resolvePublicUrl(key: string): string;
  uploadObject(input: StorageObjectUploadInput): Promise<void>;
}
