import { z } from 'zod';

import { gqlOptional } from '@/server/features/common/schemas/validators/gql-optional.validators';

const nullableTrimmedString = z.string().trim().min(1).nullable().optional();

export const createCustomerInputSchema = z.object({
  email: z.email().nullable().optional(),
  language: z.enum(['en', 'fr']).nullable().optional(),
  name: z.string().trim().min(1),
  notesContent: z.unknown().nullable().optional(),
  phone: nullableTrimmedString,
});

export const updateCustomerInputSchema = z
  .object({
    email: z.email().nullable().optional(),
    id: z.string().trim().min(1),
    isActive: z.boolean().nullable().optional(),
    language: gqlOptional(z.enum(['en', 'fr'])),
    name: gqlOptional(z.string().trim().min(1)),
    notesContent: z.unknown().nullable().optional(),
    phone: nullableTrimmedString,
  })
  .refine(
    (input) =>
      input.email !== undefined ||
      input.isActive !== undefined ||
      input.language !== undefined ||
      input.name !== undefined ||
      input.notesContent !== undefined ||
      input.phone !== undefined,
    {
      message: 'At least one field must be provided for customer update',
    }
  );

export type CreateCustomerInput = z.infer<typeof createCustomerInputSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerInputSchema>;
