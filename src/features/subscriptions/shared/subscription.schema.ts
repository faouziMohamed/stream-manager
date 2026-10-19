import { z } from 'zod';

/**
 * One form, one schema. `customerMode` drives which half of the customer
 * fields is required, so the operator never fills both.
 */
export const subscriptionFormSchema = z
  .object({
    customerId: z.string().trim().optional().default(''),
    customerMode: z.enum(['existing', 'new']),
    isRecurring: z.boolean().default(false),
    markPaid: z.boolean().default(true),
    newCustomerEmail: z.string().trim().optional().default(''),
    newCustomerName: z.string().trim().optional().default(''),
    newCustomerPhone: z.string().trim().optional().default(''),
    planId: z.string().trim().min(1, 'Pick a plan'),
    profileKey: z.string().trim().optional().default(''),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick a start date'),
  })
  .superRefine((value, ctx) => {
    if (value.customerMode === 'existing' && value.customerId.length === 0) {
      ctx.addIssue({
        code: 'custom',
        message: 'Pick a customer',
        path: ['customerId'],
      });
    }

    if (value.customerMode === 'new' && value.newCustomerName.length === 0) {
      ctx.addIssue({
        code: 'custom',
        message: 'Enter the customer name',
        path: ['newCustomerName'],
      });
    }

    if (
      value.customerMode === 'new' &&
      value.newCustomerEmail.length > 0 &&
      !z.email().safeParse(value.newCustomerEmail).success
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'Enter a valid email or leave it blank',
        path: ['newCustomerEmail'],
      });
    }
  });

export type SubscriptionFormValues = z.infer<typeof subscriptionFormSchema>;
