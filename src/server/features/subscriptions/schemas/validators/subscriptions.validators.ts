import { z } from 'zod';

import { resourceIdPrefixes } from '@/server/common/constants/id-prefixes';
import { prefixedResourceIdSchema } from '@/server/features/common/schemas/validators/id-prefix.validators';

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD date');

const newCustomerSchema = z.object({
  email: z.email().nullable().optional().default(null),
  name: z.string().trim().min(1, 'Customer name is required'),
  phone: z.string().trim().min(1).nullable().optional().default(null),
});

const profileSelectionSchema = z.object({
  accountId: prefixedResourceIdSchema(resourceIdPrefixes.account, 'Streaming account'),
  profileId: prefixedResourceIdSchema(resourceIdPrefixes.profile, 'Streaming profile'),
});

/**
 * The one input behind the whole flow. Either an existing customer is picked
 * or a new one is described inline — never both, never neither.
 */
export const createSubscriptionInputSchema = z
  .object({
    customerId: prefixedResourceIdSchema(resourceIdPrefixes.customer, 'Customer')
      .nullable()
      .optional()
      .default(null),
    isRecurring: z.boolean().optional().default(false),
    markPaid: z.boolean().optional().default(false),
    newCustomer: newCustomerSchema.nullable().optional().default(null),
    planId: prefixedResourceIdSchema(resourceIdPrefixes.plan, 'Plan'),
    profile: profileSelectionSchema.nullable().optional().default(null),
    startDate: isoDateSchema,
  })
  .refine((value) => (value.customerId === null) !== (value.newCustomer === null), {
    message: 'Provide either an existing customerId or a newCustomer, not both',
    path: ['customerId'],
  })
  .transform((value) => ({
    ...value,
    // Downstream code reads customerId only when newCustomer is null; keeping
    // it a string there avoids threading null through the use-case.
    customerId: value.customerId ?? '',
  }));

export const availableProfilesInputSchema = z.object({
  serviceId: prefixedResourceIdSchema(resourceIdPrefixes.service, 'Service'),
});

export type AvailableProfilesInput = z.infer<typeof availableProfilesInputSchema>;
export type CreateSubscriptionInput = z.infer<typeof createSubscriptionInputSchema>;
