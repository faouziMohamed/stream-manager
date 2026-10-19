import { z } from 'zod';

import { prefixedIdSchemas } from '@/server/features/common/schemas/validators/id-prefix.validators';
import { paginationValidators } from '@/server/features/common/schemas/validators/pagination.validators';

export const listMediaAssetsInputSchema = paginationValidators;

export const deleteMediaAssetInputSchema = z.object({
  id: prefixedIdSchemas.mediaAsset,
});

export const toggleNotificationEventInputSchema = z.object({
  enabled: z.boolean(),
  event: z.string().trim().min(1),
});

export const generateSummaryLinkInputSchema = z.object({
  expiresInDays: z.number().int().min(1).max(365).optional().nullable(),
  label: z.string().trim().min(1).optional().nullable(),
});

export const revokeSummaryLinkInputSchema = z.object({
  id: prefixedIdSchemas.summaryLink,
});

export type ListMediaAssetsInput = z.infer<typeof listMediaAssetsInputSchema>;
export type DeleteMediaAssetInput = z.infer<typeof deleteMediaAssetInputSchema>;
export type ToggleNotificationEventInput = z.infer<typeof toggleNotificationEventInputSchema>;
export type GenerateSummaryLinkInput = z.infer<typeof generateSummaryLinkInputSchema>;
export type RevokeSummaryLinkInput = z.infer<typeof revokeSummaryLinkInputSchema>;
