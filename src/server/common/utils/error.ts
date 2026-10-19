import type { ZodError } from 'zod';

export function beautify(error: ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join('.') : 'input';
      return `${path}: ${issue.message}`;
    })
    .join('; ');
}
