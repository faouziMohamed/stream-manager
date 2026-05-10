import { z } from 'zod';

export const linkSchema = z.object({
  label: z.string().optional(),
  showSensitiveInfo: z.boolean(),
  expiresAt: z.string().optional(),
});

export type LinkForm = z.infer<typeof linkSchema>;
