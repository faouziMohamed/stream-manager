import pino from 'pino';

import { env } from '@/server/config/env';

const redactedPaths = [
  'authorization',
  'headers.authorization',
  'req.headers.authorization',
] as const;

export const logger = pino({
  base: {
    env: env.NODE_ENV,
    service: 'stream-api',
  },
  errorKey: 'error',
  formatters: {
    level(label) {
      return { level: label };
    },
  },
  level: env.LOG_LEVEL,
  messageKey: 'message',
  redact: {
    censor: '[Redacted]',
    paths: [...redactedPaths],
  },
  serializers: {
    err: pino.stdSerializers.err,
    error: pino.stdSerializers.err,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  transport:
    env.NODE_ENV === 'development' && env.LOG_PRETTY
      ? {
          options: {
            colorize: true,
            ignore: 'pid,hostname',
            singleLine: true,
            translateTime: "yyyy-mm-dd'T'HH:MM:ss.l'Z'",
          },
          target: 'pino-pretty',
        }
      : undefined,
});

export function createLogger(module: string, bindings: Record<string, unknown> = {}) {
  return logger.child({ module, ...bindings });
}
