import {
  appSettingsMutationResolvers,
  appSettingsQueryResolvers,
} from "@/lib/graphql/resolvers/settings/app-settings.resolvers";
import {
  summaryLinksMutationResolvers,
  summaryLinksQueryResolvers,
} from "@/lib/graphql/resolvers/settings/summary-links.resolvers";
import {
  smtpSettingsMutationResolvers,
  smtpSettingsQueryResolvers,
} from "@/lib/graphql/resolvers/settings/smtp-settings.resolvers";
import {
  cloudinarySettingsMutationResolvers,
  cloudinarySettingsQueryResolvers,
} from "@/lib/graphql/resolvers/settings/cloudinary-settings.resolvers";
import {
  inquiriesMutationResolvers,
  inquiriesQueryResolvers,
} from "@/lib/graphql/resolvers/settings/inquiries.resolvers";
import {
  notificationsMutationResolvers,
  notificationsQueryResolvers,
} from "@/lib/graphql/resolvers/settings/notifications.resolvers";
import { env } from "@/lib/settings/env";

export const settingsResolvers = {
  Query: {
    ...appSettingsQueryResolvers,
    ...summaryLinksQueryResolvers,
    ...smtpSettingsQueryResolvers,
    ...cloudinarySettingsQueryResolvers,
    ...inquiriesQueryResolvers,
    ...notificationsQueryResolvers,
  },
  Mutation: {
    ...appSettingsMutationResolvers,
    ...summaryLinksMutationResolvers,
    ...smtpSettingsMutationResolvers,
    ...cloudinarySettingsMutationResolvers,
    ...inquiriesMutationResolvers,
    ...notificationsMutationResolvers,
  },
  SummaryLink: {
    shareUrl: (parent: { token: string }) =>
      `${env.BETTER_AUTH_URL}/s/${parent.token}`,
  },
};
