import { GraphQLError } from 'graphql';

import { AppError } from '@/server/common/errors/app-error';
import { maskGraphqlError } from '@/server/common/errors/graphql-error';

describe('maskGraphqlError', () => {
  it('preserves AppError code and status for GraphQL responses', () => {
    const masked = maskGraphqlError(
      new GraphQLError('Wrapped', {
        originalError: new AppError('Invalid token', 401, 'INVALID_TOKEN'),
      }),
      'Unexpected error'
    );

    expect(masked).toBeInstanceOf(GraphQLError);
    expect(masked.message).toBe('Invalid token');
    expect((masked as GraphQLError).extensions).toMatchObject({
      code: 'INVALID_TOKEN',
      statusCode: 401,
    });
  });

  it('masks unexpected errors', () => {
    const masked = maskGraphqlError(new Error('database password leaked'), 'Unexpected error');

    expect(masked.message).toBe('Unexpected error');
  });
});
