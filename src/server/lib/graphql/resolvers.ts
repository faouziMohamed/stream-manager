import { analyticsResolvers } from '@/server/features/analytics/resolvers/analytics.resolvers';
import { authResolvers } from '@/server/features/auth/resolvers/auth.resolvers';
import { customersResolvers } from '@/server/features/customers/resolvers/customers.resolvers';
import { documentsResolvers } from '@/server/features/documents/resolvers/documents.resolvers';
import { membershipsResolvers } from '@/server/features/memberships/resolvers/memberships.resolvers';
import { paymentsResolvers } from '@/server/features/payments/resolvers/payments.resolvers';
import { plansResolvers } from '@/server/features/plans/resolvers/plans.resolvers';
import { servicesResolvers } from '@/server/features/services/resolvers/services.resolvers';
import { settingsResolvers } from '@/server/features/settings/resolvers/settings.resolvers';
import { streamingAccountsResolvers } from '@/server/features/streaming-accounts/resolvers/streaming-accounts.resolvers';
import { subscriptionsResolvers } from '@/server/features/subscriptions/resolvers/subscriptions.resolvers';

export const schemaResolvers = {
  JSON: servicesResolvers.JSON,
  Upload: settingsResolvers.Upload,
  Query: {
    _health: () => 'ok',
    ...analyticsResolvers.Query,
    ...authResolvers.Query,
    ...customersResolvers.Query,
    ...membershipsResolvers.Query,
    ...paymentsResolvers.Query,
    ...plansResolvers.Query,
    ...servicesResolvers.Query,
    ...settingsResolvers.Query,
    ...streamingAccountsResolvers.Query,
    ...subscriptionsResolvers.Query,
  },
  Mutation: {
    ...authResolvers.Mutation,
    ...customersResolvers.Mutation,
    ...documentsResolvers.Mutation,
    ...membershipsResolvers.Mutation,
    ...paymentsResolvers.Mutation,
    ...plansResolvers.Mutation,
    ...servicesResolvers.Mutation,
    ...settingsResolvers.Mutation,
    ...streamingAccountsResolvers.Mutation,
    ...subscriptionsResolvers.Mutation,
  },
};
