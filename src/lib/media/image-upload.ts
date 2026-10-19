/**
 * Maximum size for an image upload, measured against the raw file bytes (the
 * same value the API enforces on the uploaded file). Keep this comfortably
 * below the Server Action body limit in `next.config.ts`.
 */
export const MAX_IMAGE_UPLOAD_BYTES = 8 * 1024 * 1024;

export const MAX_IMAGE_UPLOAD_LABEL = '8 MB';

export function imageTooLargeMessage(): string {
  return `Image is too large. Choose a file under ${MAX_IMAGE_UPLOAD_LABEL}.`;
}

export function isImageWithinSizeLimit(file: File): boolean {
  return file.size <= MAX_IMAGE_UPLOAD_BYTES;
}
