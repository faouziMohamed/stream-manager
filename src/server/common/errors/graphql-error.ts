import { GraphQLError } from 'graphql';

import { AppError } from '@/server/common/errors/app-error';

export function maskGraphqlError(error: unknown, message: string): Error {
  if (error instanceof GraphQLError && error.originalError instanceof AppError) {
    return new GraphQLError(error.originalError.message, {
      extensions: {
        code: error.originalError.code ?? 'INTERNAL_SERVER_ERROR',
        statusCode: error.originalError.statusCode,
      },
    });
  }

  if (error instanceof AppError) {
    return new GraphQLError(error.message, {
      extensions: {
        code: error.code ?? 'INTERNAL_SERVER_ERROR',
        statusCode: error.statusCode,
      },
    });
  }

  if (error instanceof GraphQLError && error.extensions.code !== undefined) {
    return error;
  }

  return new GraphQLError(message, {
    extensions: { code: 'INTERNAL_SERVER_ERROR' },
  });
}
