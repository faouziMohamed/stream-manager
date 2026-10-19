import { z } from 'zod';

export const revenueChartInputSchema = z.object({
  months: z.number().int().min(1).max(24).default(6),
});

export type RevenueChartInput = z.infer<typeof revenueChartInputSchema>;
