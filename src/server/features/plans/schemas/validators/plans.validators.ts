import { z } from 'zod';

import { env } from '@/server/config/env';

import { gqlOptional } from '@/server/features/common/schemas/validators/gql-optional.validators';
import { paginationValidators } from '@/server/features/common/schemas/validators/pagination.validators';
import { prefixedIdSchemas } from '@/server/features/common/schemas/validators/id-prefix.validators';

const planTypeSchema = z.enum(['individual', 'shared', 'family']);
const planIdSchema = prefixedIdSchemas.plan;
const serviceIdSchema = prefixedIdSchemas.service;

export const createPlanInputSchema = z.object({
  currencyCode: z.string().trim().min(1).default(env.DEFAULT_CURRENCY),
  descriptionContent: z.unknown().nullable().optional(),
  durationMonths: z.number().int().positive(),
  name: z.string().trim().min(1),
  planType: planTypeSchema.default('individual'),
  price: z.string().trim().min(1),
  // Every plan belongs to a streaming service.
  serviceId: serviceIdSchema,
});

export const updatePlanInputSchema = z.object({
  currencyCode: gqlOptional(z.string().trim().min(1)),
  descriptionContent: z.unknown().nullable().optional(),
  durationMonths: gqlOptional(z.number().int().positive()),
  id: planIdSchema,
  isActive: gqlOptional(z.boolean()),
  name: gqlOptional(z.string().trim().min(1)),
  planType: gqlOptional(planTypeSchema),
  price: gqlOptional(z.string().trim().min(1)),
  serviceId: gqlOptional(serviceIdSchema),
});

export const deletePlanInputSchema = z.object({
  id: planIdSchema,
});

export const getPlanInputSchema = z.object({
  id: planIdSchema,
});

export const listPlansInputSchema = paginationValidators.extend({
  isActive: gqlOptional(z.boolean()),
  planType: gqlOptional(planTypeSchema),
  serviceId: gqlOptional(serviceIdSchema),
});

export type CreatePlanInput = z.infer<typeof createPlanInputSchema>;
export type ListPlansInput = z.infer<typeof listPlansInputSchema>;
export type UpdatePlanInput = z.infer<typeof updatePlanInputSchema>;
