import { z } from 'zod';

import { resourceIdPrefixes } from '@/server/common/constants/id-prefixes';

const resourceIdSuffixPattern = '[A-Za-z0-9_-]+';

export function prefixedResourceIdSchema(prefix: string, label: string) {
  return z
    .string()
    .trim()
    .regex(
      new RegExp(`^${prefix}_${resourceIdSuffixPattern}$`),
      `${label} id must start with '${prefix}_'`
    );
}

export const prefixedIdSchemas = {
  customer: prefixedResourceIdSchema(resourceIdPrefixes.customer, 'Customer'),
  membership: prefixedResourceIdSchema(resourceIdPrefixes.membership, 'Membership'),
  mediaAsset: prefixedResourceIdSchema(resourceIdPrefixes.mediaAsset, 'Media asset'),
  payment: prefixedResourceIdSchema(resourceIdPrefixes.payment, 'Payment'),
  plan: prefixedResourceIdSchema(resourceIdPrefixes.plan, 'Plan'),
  service: prefixedResourceIdSchema(resourceIdPrefixes.service, 'Service'),
  session: prefixedResourceIdSchema(resourceIdPrefixes.session, 'Session'),
  summaryLink: prefixedResourceIdSchema(resourceIdPrefixes.summaryLink, 'Summary link'),
} as const;
