import { z } from 'zod';

import { gqlOptional } from '@/server/features/common/schemas/validators/gql-optional.validators';

export const createStreamingAccountInputSchema = z.object({
  email: z.string().email().optional().nullable(),
  label: z.string().trim().min(1),
  maxProfiles: z.number().int().min(1).max(100).default(1),
  password: z.string().optional().nullable(),
  serviceId: z.string().trim().min(1),
  supportsProfiles: z.boolean().default(false),
});

export const createStreamingProfileInputSchema = z.object({
  accountId: z.string().trim().min(1),
  name: z.string().trim().min(1),
  pin: z.string().optional().nullable(),
});

export const assignProfileToMembershipInputSchema = z.object({
  membershipId: z.string().trim().min(1),
  profileId: z.string().trim().min(1),
  accountId: z.string().trim().min(1),
});

export const unassignProfileInputSchema = z.object({
  assignmentId: z.string().trim().min(1),
});

export const updateStreamingAccountInputSchema = z.object({
  email: z.string().email().optional().nullable(),
  id: z.string().trim().min(1),
  label: z.string().trim().min(1).nullable().optional(),
  maxProfiles: z.number().int().min(1).max(100).nullable().optional(),
  password: z.string().optional().nullable(),
  supportsProfiles: z.boolean().nullable().optional(),
});

export const updateStreamingProfileInputSchema = z.object({
  id: z.string().trim().min(1),
  name: gqlOptional(z.string().trim().min(1)),
  pin: z.string().optional().nullable(),
});

export const deleteStreamingAccountInputSchema = z.object({
  id: z.string().trim().min(1),
});

export const deleteStreamingProfileInputSchema = z.object({
  id: z.string().trim().min(1),
});

export type CreateStreamingAccountInput = z.input<typeof createStreamingAccountInputSchema>;
export type CreateStreamingProfileInput = z.infer<typeof createStreamingProfileInputSchema>;
export type UpdateStreamingAccountInput = z.infer<typeof updateStreamingAccountInputSchema>;
export type UpdateStreamingProfileInput = z.infer<typeof updateStreamingProfileInputSchema>;
export type DeleteStreamingAccountInput = z.infer<typeof deleteStreamingAccountInputSchema>;
export type DeleteStreamingProfileInput = z.infer<typeof deleteStreamingProfileInputSchema>;
export type AssignProfileToMembershipInput = z.infer<typeof assignProfileToMembershipInputSchema>;
export type UnassignProfileInput = z.infer<typeof unassignProfileInputSchema>;
