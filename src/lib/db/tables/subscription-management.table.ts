import {
  boolean,
  date,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const planTypeEnum = pgEnum("plan_type", [
  "full",
  "partial",
  "custom",
  "bundle",
]);

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "expired",
  "paused",
  "cancelled",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "paid",
  "unpaid",
  "overdue",
]);

// ─── App Settings ─────────────────────────────────────────────────────────────

/**
 * Key-value store for app-wide settings (e.g. default currency).
 */
export const appSettings = pgTable("settings_app_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * Dedicated SMTP configuration row (single row, id = 'default').
 * Sensitive fields (password) are AES-256-GCM encrypted at the application layer.
 */
export const smtpSettings = pgTable("settings_smtp", {
  id: text("id").primaryKey().default("default"),
  host: text("host").notNull(),
  port: integer("port").notNull().default(587),
  secure: boolean("secure").notNull().default(false),
  user: text("user").notNull(),
  passwordEncrypted: text("password_encrypted"),
  senderEmail: text("sender_email").notNull(),
  senderName: text("sender_name").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * Dedicated Cloudinary configuration row (single row, id = 'default').
 * apiSecret is AES-256-GCM encrypted at the application layer.
 */
export const cloudinarySettings = pgTable("settings_cloudinary", {
  id: text("id").primaryKey().default("default"),
  cloudName: text("cloud_name").notNull(),
  apiKey: text("api_key").notNull(),
  apiSecretEncrypted: text("api_secret_encrypted").notNull(),
  uploadPreset: text("upload_preset"),
  folder: text("folder").default("streammanager"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── Services ─────────────────────────────────────────────────────────────────

/**
 * A streaming service (e.g. Netflix, Shahid VIP, Spotify).
 */
export const services = pgTable("services_services", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull().default("streaming"),
  description: text("description"),
  logoUrl: text("logo_url"),
  isActive: boolean("is_active").notNull().default(true),
  showOnHomepage: boolean("show_on_homepage").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── Plans ────────────────────────────────────────────────────────────────────

/**
 * A specific plan for a service (e.g. Netflix 3 months = 119 DH).
 * Plans can belong to a single service OR a promotion (bundle of services).
 */
export const plans = pgTable("services_plans", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  durationMonths: integer("duration_months").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  currencyCode: text("currency_code").notNull().default("MAD"),
  planType: planTypeEnum("plan_type").notNull().default("full"),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  // Either serviceId OR promotionId is set (not both)
  serviceId: text("service_id").references(() => services.id, {
    onDelete: "cascade",
  }),
  promotionId: text("promotion_id").references(() => promotions.id, {
    onDelete: "cascade",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── Promotions (Bundles) ──────────────────────────────────────────────────────

/**
 * A promotion is a named bundle of multiple services sold at a package price.
 * e.g. "Netflix + Shahid VIP + Prime Video"
 */
export const promotions = pgTable("promotions_promotions", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  showOnHomepage: boolean("show_on_homepage").notNull().default(true),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * Junction table: which services are included in a promotion.
 */
export const promotionServices = pgTable("promotion_services", {
  id: text("id").primaryKey(),
  promotionId: text("promotion_id")
    .notNull()
    .references(() => promotions.id, { onDelete: "cascade" }),
  serviceId: text("service_id")
    .notNull()
    .references(() => services.id, { onDelete: "cascade" }),
});

// ─── Subscriptions ────────────────────────────────────────────────────────────
export const clients = pgTable("subscriptions_clients", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * A client's subscription to a plan (single service or promotion bundle).
 * isRecurring: if true, a new subscription is auto-suggested on renewal.
 */
export const subscriptions = pgTable("subscriptions_subscriptions", {
  id: text("id").primaryKey(),
  clientId: text("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  planId: text("plan_id")
    .notNull()
    .references(() => plans.id, { onDelete: "restrict" }),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  isRecurring: boolean("is_recurring").notNull().default(false),
  status: subscriptionStatusEnum("status").notNull().default("active"),
  notes: text("notes"),
  // Track if this is a renewal of a previous subscription
  renewedFromId: text("renewed_from_id"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── Payments ─────────────────────────────────────────────────────────────────

/**
 * Payment record for a subscription.
 * One payment is created per subscription period.
 * On renewal, a new subscription + payment is created.
 */
export const payments = pgTable("subscriptions_payments", {
  id: text("id").primaryKey(),
  subscriptionId: text("subscription_id")
    .notNull()
    .references(() => subscriptions.id, { onDelete: "cascade" }),
  dueDate: date("due_date").notNull(),
  paidDate: date("paid_date"),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  currencyCode: text("currency_code").notNull().default("MAD"),
  status: paymentStatusEnum("status").notNull().default("unpaid"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── Contact Inquiries ────────────────────────────────────────────────────────

export const contactInquiries = pgTable("contact_inquiries", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  message: text("message").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── Shared Summary Links ─────────────────────────────────────────────────────

/**
 * Short shareable links for the read-only accountant summary page.
 */
export const summaryLinks = pgTable("summary_links", {
  id: text("id").primaryKey(),
  token: text("token").notNull().unique(),
  label: text("label"),
  showSensitiveInfo: boolean("show_sensitive_info").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── Streaming Accounts ───────────────────────────────────────────────────────

/**
 * A real streaming account you own.
 * Tracks which platform account is used, how many profiles it supports.
 * No password stored — use your password manager for credentials.
 */
export const streamingAccounts = pgTable("streaming_accounts", {
  id: text("id").primaryKey(),
  serviceId: text("service_id")
    .notNull()
    .references(() => services.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  email: text("email"),
  phone: text("phone"),
  supportsProfiles: boolean("supports_profiles").notNull().default(true), // e.g. Netflix yes, Spotify no
  maxProfiles: integer("max_profiles").notNull().default(1),
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * A named profile inside a streaming account.
 * e.g. "Profil 1", "Profil Kids" within a Netflix account.
 * pin: AES-256-GCM encrypted value stored as "iv:authTag:ciphertext" hex.
 */
export const streamingProfiles = pgTable("streaming_profiles", {
  id: text("id").primaryKey(),
  accountId: text("account_id")
    .notNull()
    .references(() => streamingAccounts.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // e.g. "Profil 1", "Kids"
  profileIndex: integer("profile_index").notNull().default(1),
  pinEncrypted: text("pin_encrypted"), // AES-256-GCM encrypted PIN (nullable)
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * Links a subscription to the streaming profile the client is using.
 * For services without profiles, only accountId is set (profileId null).
 */
export const subscriptionProfiles = pgTable("subscription_profiles", {
  id: text("id").primaryKey(),
  subscriptionId: text("subscription_id")
    .notNull()
    .references(() => subscriptions.id, { onDelete: "cascade" }),
  accountId: text("account_id")
    .notNull()
    .references(() => streamingAccounts.id, { onDelete: "cascade" }),
  profileId: text("profile_id").references(() => streamingProfiles.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── Relations ────────────────────────────────────────────────────────────────

export const servicesRelations = relations(services, ({ many }) => ({
  plans: many(plans),
  promotionServices: many(promotionServices),
}));

export const promotionsRelations = relations(promotions, ({ many }) => ({
  plans: many(plans),
  promotionServices: many(promotionServices),
}));

export const promotionServicesRelations = relations(
  promotionServices,
  ({ one }) => ({
    promotion: one(promotions, {
      fields: [promotionServices.promotionId],
      references: [promotions.id],
    }),
    service: one(services, {
      fields: [promotionServices.serviceId],
      references: [services.id],
    }),
  }),
);

export const plansRelations = relations(plans, ({ one, many }) => ({
  service: one(services, {
    fields: [plans.serviceId],
    references: [services.id],
  }),
  promotion: one(promotions, {
    fields: [plans.promotionId],
    references: [promotions.id],
  }),
  subscriptions: many(subscriptions),
}));

export const clientsRelations = relations(clients, ({ many }) => ({
  subscriptions: many(subscriptions),
}));

export const subscriptionsRelations = relations(
  subscriptions,
  ({ one, many }) => ({
    client: one(clients, {
      fields: [subscriptions.clientId],
      references: [clients.id],
    }),
    plan: one(plans, {
      fields: [subscriptions.planId],
      references: [plans.id],
    }),
    payments: many(payments),
  }),
);

export const paymentsRelations = relations(payments, ({ one }) => ({
  subscription: one(subscriptions, {
    fields: [payments.subscriptionId],
    references: [subscriptions.id],
  }),
}));

export const streamingAccountsRelations = relations(
  streamingAccounts,
  ({ many }) => ({
    profiles: many(streamingProfiles),
    subscriptionProfiles: many(subscriptionProfiles),
  }),
);

export const streamingProfilesRelations = relations(
  streamingProfiles,
  ({ one }) => ({
    account: one(streamingAccounts, {
      fields: [streamingProfiles.accountId],
      references: [streamingAccounts.id],
    }),
    subscriptionProfile: one(subscriptionProfiles, {
      fields: [streamingProfiles.id],
      references: [subscriptionProfiles.profileId],
    }),
  }),
);

export const subscriptionProfilesRelations = relations(
  subscriptionProfiles,
  ({ one }) => ({
    subscription: one(subscriptions, {
      fields: [subscriptionProfiles.subscriptionId],
      references: [subscriptions.id],
    }),
    account: one(streamingAccounts, {
      fields: [subscriptionProfiles.accountId],
      references: [streamingAccounts.id],
    }),
    profile: one(streamingProfiles, {
      fields: [subscriptionProfiles.profileId],
      references: [streamingProfiles.id],
    }),
  }),
);

// ─── Types ────────────────────────────────────────────────────────────────────

export type Service = typeof services.$inferSelect;
export type NewService = typeof services.$inferInsert;
export type Plan = typeof plans.$inferSelect;
export type NewPlan = typeof plans.$inferInsert;
export type Promotion = typeof promotions.$inferSelect;
export type NewPromotion = typeof promotions.$inferInsert;
export type PromotionService = typeof promotionServices.$inferSelect;
export type Client = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;
export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
export type ContactInquiry = typeof contactInquiries.$inferSelect;
export type SummaryLink = typeof summaryLinks.$inferSelect;
export type StreamingAccount = typeof streamingAccounts.$inferSelect;
export type NewStreamingAccount = typeof streamingAccounts.$inferInsert;
export type StreamingProfile = typeof streamingProfiles.$inferSelect;
export type NewStreamingProfile = typeof streamingProfiles.$inferInsert;
export type SubscriptionProfile = typeof subscriptionProfiles.$inferSelect;
export type NewSubscriptionProfile = typeof subscriptionProfiles.$inferInsert;
