import { DateResolver, DateTimeResolver } from "graphql-scalars";
import { servicesResolvers } from "./services.resolvers";
import { plansResolvers } from "./plans.resolvers";
import { promotionsResolvers } from "./promotions.resolvers";
import { clientsResolvers } from "./clients.resolvers";
import { subscriptionsResolvers } from "./subscriptions.resolvers";
import { paymentsResolvers } from "./payments.resolvers";
import { analyticsResolvers } from "./analytics.resolvers";
import { settingsResolvers } from "./settings";
import { accountsResolvers } from "./accounts";

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
