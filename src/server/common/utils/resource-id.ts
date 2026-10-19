import { randomUUID } from 'node:crypto';

export function createResourceId(prefix: string): string {
  return `${prefix}_${randomUUID().replaceAll('-', '')}`;
}
