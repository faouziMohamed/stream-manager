import { z } from 'zod';

export const customerFormSchema = z.object({
  /** Which language this customer's bills and receipts are written in. */
  language: z.enum(['en', 'fr']).default('fr'),
  name: z.string().min(1, 'Name is required'),
  email: z
    .string()
    .email('Invalid email address')
    .or(z.literal(''))
    .optional()
    .transform((v) => (v === '' ? undefined : v)),
  phone: z.string().optional(),
  // Rich-text (Tiptap JSON) document, or null/undefined when empty.
  notes: z.unknown().optional(),
});

export type CustomerFormValues = z.infer<typeof customerFormSchema>;
