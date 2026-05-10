import { DateResolver, DateTimeResolver } from 'graphql-scalars';
import { servicesResolvers } from '@/lib/graphql/resolvers/services.resolvers';
import { plansResolvers } from '@/lib/graphql/resolvers/plans.resolvers';
import { promotionsResolvers } from '@/lib/graphql/resolvers/promotions.resolvers';
import { clientsResolvers } from '@/lib/graphql/resolvers/clients.resolvers';
import { subscriptionsResolvers } from '@/lib/graphql/resolvers/subscriptions.resolvers';
import { paymentsResolvers } from '@/lib/graphql/resolvers/payments.resolvers';
import { analyticsResolvers } from '@/lib/graphql/resolvers/analytics.resolvers';
import { settingsResolvers } from '@/lib/graphql/resolvers/settings';
import { accountsResolvers } from '@/lib/graphql/resolvers/accounts';

export const resolvers = {
  // Custom scalars
  Date: DateResolver,
  DateTime: DateTimeResolver,

  Query: {
    ...servicesResolvers.Query,
    ...plansResolvers.Query,
    ...promotionsResolvers.Query,
    ...clientsResolvers.Query,
    ...subscriptionsResolvers.Query,
    ...paymentsResolvers.Query,
    ...analyticsResolvers.Query,
    ...settingsResolvers.Query,
    ...accountsResolvers.Query,
  },

  Mutation: {
    ...servicesResolvers.Mutation,
    ...plansResolvers.Mutation,
    ...promotionsResolvers.Mutation,
    ...clientsResolvers.Mutation,
    ...subscriptionsResolvers.Mutation,
    ...paymentsResolvers.Mutation,
    ...settingsResolvers.Mutation,
    ...accountsResolvers.Mutation,
  },

  // Type resolvers
  Service: servicesResolvers.Service,
  Plan: plansResolvers.Plan,
  Promotion: promotionsResolvers.Promotion,
  Client: clientsResolvers.Client,
  Subscription: subscriptionsResolvers.Subscription,
  Payment: paymentsResolvers.Payment,
  SummaryLink: settingsResolvers.SummaryLink,
  StreamingAccount: accountsResolvers.StreamingAccount,
  StreamingProfile: accountsResolvers.StreamingProfile,
};
