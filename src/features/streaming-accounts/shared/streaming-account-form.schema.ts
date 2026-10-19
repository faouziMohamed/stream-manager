import { z } from 'zod';

export const streamingAccountUpdateSchema = z.object({
  email: z.union([z.literal(''), z.email('Use a valid email address')]).optional(),
  label: z.string().trim().min(1, 'Account label is required').max(120).optional(),
  maxProfiles: z.preprocess(
    (v) => (Number.isNaN(v) ? undefined : v),
    z
      .number({ error: 'Enter a valid number' })
      .int('Must be a whole number')
      .min(1, 'At least 1 profile')
      .max(100, 'At most 100 profiles')
      .optional()
  ),
  supportsProfiles: z.boolean().optional(),
});

export type StreamingAccountUpdateValues = z.infer<typeof streamingAccountUpdateSchema>;

export function toStreamingAccountUpdateValues(account: {
  email?: string | null;
  label?: string;
  maxProfiles?: number;
  supportsProfiles?: boolean;
}): StreamingAccountUpdateValues {
  return {
    email: account.email ?? '',
    label: account.label ?? '',
    maxProfiles: account.maxProfiles ?? 1,
    supportsProfiles: account.supportsProfiles ?? false,
  };
}

export const streamingAccountFormSchema = z.object({
  email: z.union([z.literal(''), z.email('Use a valid email address')]),
  label: z.string().trim().min(1, 'Account label is required').max(120),
  maxProfiles: z
    .number({ error: 'Enter a valid number' })
    .int('Must be a whole number')
    .min(1, 'At least 1 profile')
    .max(100, 'At most 100 profiles'),
  password: z.string().max(256),
  serviceId: z.string().min(1, 'Select a service'),
  supportsProfiles: z.boolean(),
});

export const streamingAssignmentFormSchema = z.object({
  membershipId: z.string().min(1, 'Select a membership'),
  profileId: z.string().min(1, 'Select an available profile'),
});

export type StreamingAccountFormValues = z.infer<typeof streamingAccountFormSchema>;
export type StreamingAssignmentFormValues = z.infer<typeof streamingAssignmentFormSchema>;

export function toStreamingAccountFormValues(): StreamingAccountFormValues {
  return {
    email: '',
    label: '',
    maxProfiles: 1,
    password: '',
    serviceId: '',
    supportsProfiles: false,
  };
}

export function toStreamingAssignmentFormValues(): StreamingAssignmentFormValues {
  return {
    membershipId: '',
    profileId: '',
  };
}
