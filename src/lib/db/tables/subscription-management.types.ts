import type {
  clients,
  contactInquiries,
  inquiryReplies,
  notificationEvents,
  notificationSettings,
  payments,
  plans,
  promotionServices,
  promotions,
  richTextAssetReferences,
  richTextAssets,
  services,
  streamingAccounts,
  streamingProfiles,
  subscriptionProfiles,
  subscriptions,
  summaryLinks,
} from '@/lib/db/tables/subscription-management.table';

export type Client = typeof clients.$inferSelect;
export type ContactInquiry = typeof contactInquiries.$inferSelect;
export type InquiryReply = typeof inquiryReplies.$inferSelect;
export type NewClient = typeof clients.$inferInsert;
export type NewPayment = typeof payments.$inferInsert;
export type NewPlan = typeof plans.$inferInsert;
export type NewRichTextAsset = typeof richTextAssets.$inferInsert;
export type NewRichTextAssetReference = typeof richTextAssetReferences.$inferInsert;
export type NewService = typeof services.$inferInsert;
export type NewStreamingAccount = typeof streamingAccounts.$inferInsert;
export type NewStreamingProfile = typeof streamingProfiles.$inferInsert;
export type NewSubscription = typeof subscriptions.$inferInsert;
export type NewSubscriptionProfile = typeof subscriptionProfiles.$inferInsert;
export type NotificationEvent = typeof notificationEvents.$inferSelect;
export type NotificationSetting = typeof notificationSettings.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type Plan = typeof plans.$inferSelect;
export type Promotion = typeof promotions.$inferSelect;
export type PromotionService = typeof promotionServices.$inferSelect;
export type RichTextAsset = typeof richTextAssets.$inferSelect;
export type RichTextAssetReference = typeof richTextAssetReferences.$inferSelect;
export type Service = typeof services.$inferSelect;
export type StreamingAccount = typeof streamingAccounts.$inferSelect;
export type StreamingProfile = typeof streamingProfiles.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type SubscriptionProfile = typeof subscriptionProfiles.$inferSelect;
export type SummaryLink = typeof summaryLinks.$inferSelect;
