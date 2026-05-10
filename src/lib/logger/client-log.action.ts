'use server';

import { createLogger } from '@/lib/logger/logger';

const serverLogger = createLogger('client-forwarded');

export async function forwardClientLog(
  level: 'warn' | 'error' | 'fatal',
  module: string,
  message: string,
  data?: unknown
) {
  const log = serverLogger.child({ module, source: 'client' });
  log[level]({ data }, message);
}
