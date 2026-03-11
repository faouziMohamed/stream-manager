import { forwardClientLog } from './client-log.action';

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

function createClientLogger(module: string) {
  const log = (level: LogLevel, message: string, data?: unknown) => {
    const prefix = `[${module}]`;
    if (level === 'debug' || level === 'info') {
      // eslint-disable-next-line no-console
      console[level === 'debug' ? 'debug' : 'log'](prefix, message, data);
    } else {
      // Forward warn/error/fatal to server
      void forwardClientLog(level, module, message, data);
    }
  };

  return {
    debug: (message: string, data?: unknown) => log('debug', message, data),
    info: (message: string, data?: unknown) => log('info', message, data),
    warn: (message: string, data?: unknown) => log('warn', message, data),
    error: (message: string, data?: unknown) => log('error', message, data),
    fatal: (message: string, data?: unknown) => log('fatal', message, data),
  };
}

export { createClientLogger as clientLogger };
