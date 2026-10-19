import { z } from 'zod';

export const serviceFormSchema = z.object({
  category: z.enum(['video', 'music', 'gaming', 'other']),
  // Rich-text (Tiptap JSON) document, or null when empty.
  description: z.unknown().optional(),
  // Storage key to persist: echoes the current key (preserve), a new key, or null to remove.
  imageKey: z.string().nullable().optional(),
  // Display-only preview URL (never sent to the API).
  imageUrl: z.string().nullable().optional(),
  name: z.string().trim().min(1, 'Service name is required').max(120),
  supportsProfiles: z.boolean(),
});

export type ServiceFormValues = z.infer<typeof serviceFormSchema>;

export function toServiceFormValues(service?: {
  category: string;
  descriptionContent?: unknown;
  imageKey?: string | null;
  imageUrl?: string | null;
  name: string;
  supportsProfiles: boolean;
}): ServiceFormValues {
  return {
    category: toServiceCategory(service?.category),
    description: service?.descriptionContent ?? null,
    imageKey: service?.imageKey ?? null,
    imageUrl: service?.imageUrl ?? null,
    name: service?.name ?? '',
    supportsProfiles: service?.supportsProfiles ?? false,
  };
}

function toServiceCategory(category?: string): ServiceFormValues['category'] {
  if (category === 'music' || category === 'gaming' || category === 'other') {
    return category;
  }
  return 'video';
}
