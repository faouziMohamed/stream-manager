import { env } from '@/lib/settings/env';
import { appSettingsQueryResolvers, appSettingsMutationResolvers } from './app-settings.resolvers';
import {
  cloudinarySettingsQueryResolvers,
  cloudinarySettingsMutationResolvers,
} from './cloudinary-settings.resolvers';
import {
  smtpSettingsQueryResolvers,
  smtpSettingsMutationResolvers,
} from './smtp-settings.resolvers';
import {
  notificationsQueryResolvers,
  notificationsMutationResolvers,
} from './notifications.resolvers';
import { inquiriesQueryResolvers, inquiriesMutationResolvers } from './inquiries.resolvers';
import {
  summaryLinksQueryResolvers,
  summaryLinksMutationResolvers,
} from './summary-links.resolvers';

export { appSettingsQueryResolvers, appSettingsMutationResolvers } from './app-settings.resolvers';
export {
  cloudinarySettingsQueryResolvers,
  cloudinarySettingsMutationResolvers,
} from './cloudinary-settings.resolvers';
export {
  smtpSettingsQueryResolvers,
  smtpSettingsMutationResolvers,
} from './smtp-settings.resolvers';
export {
  notificationsQueryResolvers,
  notificationsMutationResolvers,
} from './notifications.resolvers';
export { inquiriesQueryResolvers, inquiriesMutationResolvers } from './inquiries.resolvers';
export {
  summaryLinksQueryResolvers,
  summaryLinksMutationResolvers,
} from './summary-links.resolvers';

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
    shareUrl: (parent: { token: string }) => `${env.BETTER_AUTH_URL}/s/${parent.token}`,
  },
};
