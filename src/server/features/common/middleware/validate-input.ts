import type { ZodType } from 'zod';

import { AppError } from '@/server/common/errors/app-error';
import { beautify } from '@/server/common/utils/error';

export function validateInput<TInput>(schema: ZodType<TInput>, input: unknown): TInput {
  const result = schema.safeParse(input);

  if (!result.success) {
    throw new AppError(beautify(result.error), 400, 'BAD_USER_INPUT');
  }

  return result.data;
}
