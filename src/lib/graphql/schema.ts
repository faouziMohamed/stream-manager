import { scalarsSchema } from './schema/scalars.schema';
import { servicesSchema } from './schema/services.schema';
import { plansSchema } from './schema/plans.schema';
import { promotionsSchema } from './schema/promotions.schema';
import { clientsSchema } from './schema/clients.schema';
import { subscriptionsSchema } from './schema/subscriptions.schema';
import { paymentsSchema } from './schema/payments.schema';
import { analyticsSchema } from './schema/analytics.schema';
import { settingsSchema } from './schema/settings.schema';
import { querySchema } from './schema/query.schema';
import { mutationSchema } from './schema/mutation.schema';

export const typeDefs = [
  scalarsSchema,
  servicesSchema,
  plansSchema,
  promotionsSchema,
  clientsSchema,
  subscriptionsSchema,
  paymentsSchema,
  analyticsSchema,
  settingsSchema,
  querySchema,
  mutationSchema,
].join('\n');
