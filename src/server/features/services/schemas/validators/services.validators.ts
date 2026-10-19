import { z } from 'zod';

import { gqlOptional } from '@/server/features/common/schemas/validators/gql-optional.validators';

const serviceCategorySchema = z.enum(['video', 'music', 'gaming', 'other']);

export const createServiceInputSchema = z.object({
  category: serviceCategorySchema.default('video'),
  descriptionContent: z.unknown().nullable().optional(),
  imageKey: z.string().trim().min(1).nullable().optional(),
  name: z.string().trim().min(1),
  supportsProfiles: z.boolean().default(false),
});

export const updateServiceInputSchema = z
  .object({
    category: gqlOptional(serviceCategorySchema),
    descriptionContent: z.unknown().nullable().optional(),
    id: z.string().trim().min(1),
    imageKey: z.string().trim().min(1).nullable().optional(),
    isActive: z.boolean().nullable().optional(),
    name: gqlOptional(z.string().trim().min(1)),
    supportsProfiles: gqlOptional(z.boolean()),
  })
  .refine(
    (input) =>
      input.category !== undefined ||
      input.descriptionContent !== undefined ||
      input.imageKey !== undefined ||
      input.isActive !== undefined ||
      input.name !== undefined ||
      input.supportsProfiles !== undefined,
    {
      message: 'At least one field must be provided for service update',
    }
  );

export type CreateServiceInput = z.infer<typeof createServiceInputSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceInputSchema>;
