import { z } from 'zod';

import { gqlOptional } from '@/server/features/common/schemas/validators/gql-optional.validators';

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD date');

export const createMembershipInputSchema = z.object({
  customerId: z.string().trim().min(1),
  isRecurring: z.boolean().default(false),
  planId: z.string().trim().min(1),
  startDate: isoDateSchema,
});

export const renewMembershipInputSchema = z.object({
  id: z.string().trim().min(1),
  /** Settle the payments this renewal creates, for money taken up front. */
  markPaid: gqlOptional(z.boolean()).default(false),
  /** The day the money was actually taken, when it was recorded later. */
  paidDate: gqlOptional(isoDateSchema),
  /** How many consecutive plan terms to add. One term is `plan.durationMonths`. */
  terms: gqlOptional(z.number().int().min(1).max(12)).default(1),
});

export const cancelMembershipInputSchema = z.object({
  confirmed: z.boolean(),
  id: z.string().trim().min(1),
});

export const membershipFiltersSchema = z.object({
  customerId: gqlOptional(z.string().trim().min(1)),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  planId: gqlOptional(z.string().trim().min(1)),
  serviceId: gqlOptional(z.string().trim().min(1)),
  status: gqlOptional(z.enum(['active', 'expired', 'cancelled', 'pending'])),
});

export type CancelMembershipInput = z.infer<typeof cancelMembershipInputSchema>;
export type CreateMembershipInput = z.infer<typeof createMembershipInputSchema>;
export type MembershipFilters = z.infer<typeof membershipFiltersSchema>;
export type RenewMembershipInput = z.infer<typeof renewMembershipInputSchema>;
