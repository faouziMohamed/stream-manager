import pino from "pino";

const isDev = process.env.NODE_ENV === "development";

const baseLogger = pino({
  level: isDev ? "debug" : "info",
  ...(isDev && {
    transport: {
      target: "pino-pretty",
      options: { colorize: true },
    },
  }),
});

export function createLogger(module: string) {
  return baseLogger.child({ module });
}

export type Logger = ReturnType<typeof createLogger>;
export const logger = createLogger("app");
