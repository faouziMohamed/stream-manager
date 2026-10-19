import { z } from 'zod';
import { DEFAULT_CURRENCY } from '@/lib/utils/currency';

export const planFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  durationMonths: z.coerce.number().int().min(1, 'Must be at least 1 month').max(60),
  price: z
    .string()
    .min(1, 'Price is required')
    .regex(/^\d+(\.\d{1,2})?$/, 'Enter a valid price (e.g. 99.00)'),
  currencyCode: z.string().min(1).default(DEFAULT_CURRENCY),
  planType: z.enum(['individual', 'shared', 'family']),
  // Rich-text (Tiptap JSON) document, or null when empty.
  description: z.unknown().optional(),
  // Every plan belongs to a streaming service.
  serviceId: z.string().min(1, 'A service is required'),
  isActive: z.boolean().default(true),
});

export type PlanFormValues = z.infer<typeof planFormSchema>;

export function toPlanFormValues(plan?: {
  name: string;
  durationMonths: number;
  price: string;
  currencyCode: string;
  planType: string;
  descriptionContent?: unknown;
  serviceId: string;
  isActive: boolean;
}): PlanFormValues {
  return {
    name: plan?.name ?? '',
    durationMonths: plan?.durationMonths ?? 1,
    price: plan?.price ?? '',
    currencyCode: plan?.currencyCode ?? DEFAULT_CURRENCY,
    planType: (plan?.planType ?? 'individual') as 'individual' | 'shared' | 'family',
    description: plan?.descriptionContent ?? null,
    serviceId: plan?.serviceId ?? '',
    isActive: plan?.isActive ?? true,
  };
}
