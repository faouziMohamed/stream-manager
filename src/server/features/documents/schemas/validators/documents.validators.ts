import { z } from 'zod';

import { prefixedIdSchemas } from '@/server/features/common/schemas/validators/id-prefix.validators';

export const generateDocumentInputSchema = z.object({
  customerId: prefixedIdSchemas.customer,
  kind: z.enum(['bill', 'receipt']),
  paymentIds: z.array(prefixedIdSchemas.payment).min(1).max(100),
});
