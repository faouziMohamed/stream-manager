import { analyticsTypeDefs } from '@/server/features/analytics/schemas/graphql/analytics.schema';
import { authTypeDefs } from '@/server/features/auth/schemas/graphql/auth.schema';
import { customersTypeDefs } from '@/server/features/customers/schemas/graphql/customers.schema';
import { documentsTypeDefs } from '@/server/features/documents/schemas/graphql/documents.schema';
import { membershipsTypeDefs } from '@/server/features/memberships/schemas/graphql/memberships.schema';
import { paymentsTypeDefs } from '@/server/features/payments/schemas/graphql/payments.schema';
import { plansTypeDefs } from '@/server/features/plans/schemas/graphql/plans.schema';
import { servicesTypeDefs } from '@/server/features/services/schemas/graphql/services.schema';
import { settingsTypeDefs } from '@/server/features/settings/schemas/graphql/settings.schema';
import { streamingAccountsTypeDefs } from '@/server/features/streaming-accounts/schemas/graphql/streaming-accounts.schema';
import { subscriptionsTypeDefs } from '@/server/features/subscriptions/schemas/graphql/subscriptions.schema';

const baseTypeDefs = /* GraphQL */ `
  type Query {
    _health: String!
  }

  type Mutation {
    _empty: Boolean
  }
`;

export const schemaTypeDefs = [
  baseTypeDefs,
  analyticsTypeDefs,
  authTypeDefs,
  servicesTypeDefs,
  settingsTypeDefs,
  customersTypeDefs,
  documentsTypeDefs,
  plansTypeDefs,
  membershipsTypeDefs,
  paymentsTypeDefs,
  streamingAccountsTypeDefs,
  subscriptionsTypeDefs,
];
