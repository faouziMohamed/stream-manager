'use client';

export type ClientLogger = {
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  fatal: (...args: unknown[]) => void;
};

type LogEntry = {
  module: string;
  level: 'info' | 'warn' | 'error' | 'fatal';
  timestamp: string;
  args: unknown[];
};

declare global {
  var __LOG_QUEUE: LogEntry[] | undefined;
}

export function clientLogger(moduleName: string): ClientLogger {
  return {
    info: (...args: unknown[]) => forwardClientLog(moduleName, 'info', args),
    warn: (...args: unknown[]) => forwardClientLog(moduleName, 'warn', args),
    error: (...args: unknown[]) => forwardClientLog(moduleName, 'error', args),
    fatal: (...args: unknown[]) => forwardClientLog(moduleName, 'fatal', args),
  };
}

function forwardClientLog(
  moduleName: string,
  level: 'info' | 'warn' | 'error' | 'fatal',
  args: unknown[]
): void {
  // Queue logs in browser storage for transmission on the next Server Action call.
  if (typeof window !== 'undefined' && globalThis.__LOG_QUEUE === undefined) {
    globalThis.__LOG_QUEUE = [];
  }

  const entry: LogEntry = {
    module: moduleName,
    level,
    timestamp: new Date().toISOString(),
    args: args.map((arg) => {
      if (arg instanceof Error) {
        return { message: arg.message, stack: arg.stack };
      }
      return arg;
    }),
  };

  if (typeof window !== 'undefined') {
    globalThis.__LOG_QUEUE?.push(entry);
  }

  // Keep queue-only behavior on client; forwarding is handled server-side.
  switch (level) {
    case 'warn': {
      break;
    }
    case 'error':
    case 'fatal': {
      break;
    }
    default: {
      break;
    }
  }
}
