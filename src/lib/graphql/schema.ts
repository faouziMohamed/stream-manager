import { scalarsSchema } from "@/lib/graphql/schema/scalars.schema";
import { servicesSchema } from "@/lib/graphql/schema/services.schema";
import { plansSchema } from "@/lib/graphql/schema/plans.schema";
import { promotionsSchema } from "@/lib/graphql/schema/promotions.schema";
import { clientsSchema } from "@/lib/graphql/schema/clients.schema";
import { subscriptionsSchema } from "@/lib/graphql/schema/subscriptions.schema";
import { paymentsSchema } from "@/lib/graphql/schema/payments.schema";
import { analyticsSchema } from "@/lib/graphql/schema/analytics.schema";
import {
  appSettingsSchema,
  cloudinarySettingsSchema,
  inquiriesSchema,
  notificationsSchema,
  smtpSettingsSchema,
  summaryLinksSchema,
} from "@/lib/graphql/schema/settings";
import {
  profileAssignmentsSchema,
  streamingAccountsSchema,
  streamingProfilesSchema,
} from "@/lib/graphql/schema/accounts";
import { querySchema } from "@/lib/graphql/schema/query.schema";
import { mutationSchema } from "@/lib/graphql/schema/mutation.schema";

export const typeDefs = [
  scalarsSchema,
  servicesSchema,
  plansSchema,
  promotionsSchema,
  clientsSchema,
  subscriptionsSchema,
  paymentsSchema,
  analyticsSchema,
  appSettingsSchema,
  summaryLinksSchema,
  smtpSettingsSchema,
  cloudinarySettingsSchema,
  inquiriesSchema,
  notificationsSchema,
  streamingAccountsSchema,
  streamingProfilesSchema,
  profileAssignmentsSchema,
  querySchema,
  mutationSchema,
].join("\n");
