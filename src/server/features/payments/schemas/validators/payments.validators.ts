import { z } from 'zod';

import { env } from '@/server/config/env';

import { gqlOptional } from '@/server/features/common/schemas/validators/gql-optional.validators';
import { paginationValidators } from '@/server/features/common/schemas/validators/pagination.validators';
import { prefixedIdSchemas } from '@/server/features/common/schemas/validators/id-prefix.validators';

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD date');
const paymentStatusSchema = z.enum(['unpaid', 'paid', 'overdue', 'cancelled']);
const paymentIdSchema = prefixedIdSchemas.payment;
const customerIdSchema = prefixedIdSchemas.customer;
const membershipIdSchema = prefixedIdSchemas.membership;

export const markPaymentPaidInputSchema = z.object({
  id: paymentIdSchema,
  paidDate: isoDateSchema.nullable().optional(),
});

export const getPaymentInputSchema = z.object({
  id: paymentIdSchema,
});

export const listPaymentsInputSchema = paginationValidators.extend({
  customerId: gqlOptional(customerIdSchema),
  dueFrom: gqlOptional(isoDateSchema),
  dueTo: gqlOptional(isoDateSchema),
  membershipId: gqlOptional(membershipIdSchema),
  order: gqlOptional(z.enum(['asc', 'desc'])),
  status: gqlOptional(paymentStatusSchema),
});

export const createPaymentInputSchema = z.object({
  membershipId: membershipIdSchema,
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Amount must be a positive number'),
  currencyCode: z
    .string()
    .length(3, 'Currency code must be 3 characters')
    .default(env.DEFAULT_CURRENCY),
  dueDate: isoDateSchema,
  paidDate: isoDateSchema.nullable().optional(),
  method: z.enum(['cash', 'transfer', 'other']).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
  status: paymentStatusSchema
    .nullable()
    .optional()
    .transform((v) => v ?? 'paid'),
});

export type ListPaymentsInput = z.infer<typeof listPaymentsInputSchema>;
export type MarkPaymentPaidInput = z.infer<typeof markPaymentPaidInputSchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentInputSchema>;
