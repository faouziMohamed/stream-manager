import { getOperationAST } from 'graphql';
import type { Plugin } from 'graphql-yoga';

import { AppError } from '@/server/common/errors/app-error';
import { createLogger } from '@/server/config/logger.config';

const log = createLogger('graphql-ops');

export function createGraphqlLoggingPlugin(): Plugin {
  return {
    onExecute({ args }) {
      const operationAST = getOperationAST(args.document, args.operationName ?? null);
      const opName = operationAST?.name?.value ?? 'anonymous';
      const opType = operationAST?.operation ?? 'query';

      log.debug({ operation: opName, type: opType }, 'graphql execute');

      return {
        onExecuteDone({ result }) {
          if (!('errors' in result) || !result.errors?.length) return;

          for (const error of result.errors) {
            const original = error.originalError ?? error;
            const isExpected = original instanceof AppError && original.statusCode < 500;

            const logData = {
              operation: opName,
              type: opType,
              code: error.extensions?.['code'],
              path: error.path,
              message: error.message,
            };

            if (isExpected) {
              log.warn(logData, 'graphql expected error');
            } else {
              log.error({ ...logData, err: original }, 'graphql unexpected error');
            }
          }
        },
      };
    },
  };
}
