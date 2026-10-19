import { z } from 'zod';

export const streamingProfileSchema = z.object({
  name: z.string().trim().min(1, 'Profile name is required').max(80),
  pin: z.string().trim().max(20).optional(),
});

export type StreamingProfileValues = z.infer<typeof streamingProfileSchema>;
