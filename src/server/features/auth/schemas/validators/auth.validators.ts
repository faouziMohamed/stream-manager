import { z } from 'zod';
import { prefixedIdSchemas } from '@/server/features/common/schemas/validators/id-prefix.validators';

export const loginInputSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

export const loginWithOAuthInputSchema = z.object({
  avatar: z.string().url().nullable().optional(),
  email: z.email(),
  name: z.string().min(1),
});

export const revokeSessionInputSchema = z.object({
  id: prefixedIdSchemas.session,
});
