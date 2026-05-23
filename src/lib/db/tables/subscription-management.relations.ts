import { relations } from 'drizzle-orm';

import {
  clients,
  contactInquiries,
  inquiryReplies,
  payments,
  plans,
  promotionServices,
  promotions,
  services,
  streamingAccounts,
  streamingProfiles,
  subscriptionProfiles,
  subscriptions,
} from '@/lib/db/tables/subscription-management.table';

export const clientsRelations = relations(clients, ({ many }) => ({
  subscriptions: many(subscriptions),
}));

export const contactInquiriesRelations = relations(contactInquiries, ({ many }) => ({
  replies: many(inquiryReplies),
}));

export const inquiryRepliesRelations = relations(inquiryReplies, ({ one }) => ({
  inquiry: one(contactInquiries, {
    fields: [inquiryReplies.inquiryId],
    references: [contactInquiries.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  subscription: one(subscriptions, {
    fields: [payments.subscriptionId],
    references: [subscriptions.id],
  }),
}));

export const plansRelations = relations(plans, ({ many, one }) => ({
  promotion: one(promotions, {
    fields: [plans.promotionId],
    references: [promotions.id],
  }),
  service: one(services, {
    fields: [plans.serviceId],
    references: [services.id],
  }),
  subscriptions: many(subscriptions),
}));

export const promotionServicesRelations = relations(promotionServices, ({ one }) => ({
  promotion: one(promotions, {
    fields: [promotionServices.promotionId],
    references: [promotions.id],
  }),
  service: one(services, {
    fields: [promotionServices.serviceId],
    references: [services.id],
  }),
}));

export const promotionsRelations = relations(promotions, ({ many }) => ({
  plans: many(plans),
  promotionServices: many(promotionServices),
}));

export const servicesRelations = relations(services, ({ many }) => ({
  plans: many(plans),
  promotionServices: many(promotionServices),
}));

export const streamingAccountsRelations = relations(streamingAccounts, ({ many }) => ({
  profiles: many(streamingProfiles),
  subscriptionProfiles: many(subscriptionProfiles),
}));

export const streamingProfilesRelations = relations(streamingProfiles, ({ one }) => ({
  account: one(streamingAccounts, {
    fields: [streamingProfiles.accountId],
    references: [streamingAccounts.id],
  }),
  subscriptionProfile: one(subscriptionProfiles, {
    fields: [streamingProfiles.id],
    references: [subscriptionProfiles.profileId],
  }),
}));

export const subscriptionProfilesRelations = relations(subscriptionProfiles, ({ one }) => ({
  account: one(streamingAccounts, {
    fields: [subscriptionProfiles.accountId],
    references: [streamingAccounts.id],
  }),
  profile: one(streamingProfiles, {
    fields: [subscriptionProfiles.profileId],
    references: [streamingProfiles.id],
  }),
  subscription: one(subscriptions, {
    fields: [subscriptionProfiles.subscriptionId],
    references: [subscriptions.id],
  }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ many, one }) => ({
  client: one(clients, {
    fields: [subscriptions.clientId],
    references: [clients.id],
  }),
  payments: many(payments),
  plan: one(plans, {
    fields: [subscriptions.planId],
    references: [plans.id],
  }),
}));
