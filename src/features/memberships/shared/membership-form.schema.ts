import { z } from 'zod';

export const membershipFormSchema = z.object({
  customerId: z.string().trim().min(1, 'Select a customer'),
  isRecurring: z.boolean(),
  planId: z.string().trim().min(1, 'Select a plan'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Select a valid start date'),
});

export type MembershipFormValues = z.infer<typeof membershipFormSchema>;

export function toMembershipFormValues(): MembershipFormValues {
  return {
    customerId: '',
    isRecurring: false,
    planId: '',
    startDate: new Date().toISOString().slice(0, 10),
  };
}
