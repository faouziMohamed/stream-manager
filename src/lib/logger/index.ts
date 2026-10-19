import pino from 'pino';
import type { Logger } from 'pino';

import { env } from '@/lib/settings/env';

export function createLogger(moduleName: string): Logger {
  return pino({
    name: moduleName,
    level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  });
}
