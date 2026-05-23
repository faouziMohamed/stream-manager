import {
  boolean,
  date,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { users } from '@/lib/db/tables/auth.table';

export const planTypeEnum = pgEnum('plan_type', ['full', 'partial', 'custom', 'bundle']);
export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'active',
  'expired',
  'paused',
  'cancelled',
]);
export const paymentStatusEnum = pgEnum('payment_status', ['paid', 'unpaid', 'overdue']);
export const appSettings = pgTable('settings_app_settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
export const smtpSettings = pgTable('settings_smtp', {
  id: text('id').primaryKey().default('default'),
  host: text('host').notNull(),
  port: integer('port').notNull().default(587),
  secure: boolean('secure').notNull().default(false),
  user: text('user').notNull(),
  passwordEncrypted: text('password_encrypted'),
  senderEmail: text('sender_email').notNull(),
  senderName: text('sender_name').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
export const cloudinarySettings = pgTable('settings_cloudinary', {
  id: text('id').primaryKey().default('default'),
  cloudName: text('cloud_name').notNull(),
  apiKey: text('api_key').notNull(),
  apiSecretEncrypted: text('api_secret_encrypted').notNull(),
  uploadPreset: text('upload_preset'),
  folder: text('folder').default('streammanager'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
export const services = pgTable('services_services', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  category: text('category').notNull().default('streaming'),
  description: jsonb('description'),
  logoUrl: text('logo_url'),
  isActive: boolean('is_active').notNull().default(true),
  showOnHomepage: boolean('show_on_homepage').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});
export const plans = pgTable('services_plans', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  durationMonths: integer('duration_months').notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  currencyCode: text('currency_code').notNull().default('MAD'),
  planType: planTypeEnum('plan_type').notNull().default('full'),
  description: jsonb('description'),
  isActive: boolean('is_active').notNull().default(true),
  serviceId: text('service_id').references(() => services.id, {
    onDelete: 'cascade',
  }),
  promotionId: text('promotion_id').references(() => promotions.id, {
    onDelete: 'cascade',
  }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
export const promotions = pgTable('promotions_promotions', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: jsonb('description'),
  isActive: boolean('is_active').notNull().default(true),
  showOnHomepage: boolean('show_on_homepage').notNull().default(true),
  startsAt: timestamp('starts_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
export const promotionServices = pgTable('promotion_services', {
  id: text('id').primaryKey(),
  promotionId: text('promotion_id')
    .notNull()
    .references(() => promotions.id, { onDelete: 'cascade' }),
  serviceId: text('service_id')
    .notNull()
    .references(() => services.id, { onDelete: 'cascade' }),
});
export const clients = pgTable('subscriptions_clients', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  notes: jsonb('notes'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
export const subscriptions = pgTable('subscriptions_subscriptions', {
  id: text('id').primaryKey(),
  clientId: text('client_id')
    .notNull()
    .references(() => clients.id, { onDelete: 'cascade' }),
  planId: text('plan_id')
    .notNull()
    .references(() => plans.id, { onDelete: 'restrict' }),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  isRecurring: boolean('is_recurring').notNull().default(false),
  status: subscriptionStatusEnum('status').notNull().default('active'),
  notes: jsonb('notes'),
  renewedFromId: text('renewed_from_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const payments = pgTable('subscriptions_payments', {
  id: text('id').primaryKey(),
  subscriptionId: text('subscription_id')
    .notNull()
    .references(() => subscriptions.id, { onDelete: 'cascade' }),
  dueDate: date('due_date').notNull(),
  paidDate: date('paid_date'),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  currencyCode: text('currency_code').notNull().default('MAD'),
  status: paymentStatusEnum('status').notNull().default('unpaid'),
  notes: jsonb('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
export const notificationSettings = pgTable('notification_settings', {
  event: text('event').primaryKey(), // e.g. 'new_inquiry', 'payment_overdue', ...
  enabled: boolean('enabled').notNull().default(true),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
export const notificationEvents = pgTable('notification_events', {
  id: text('id').primaryKey(),
  event: text('event').notNull(),
  subject: text('subject').notNull(),
  toEmail: text('to_email').notNull(),
  success: boolean('success').notNull(),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
export const contactInquiries = pgTable('contact_inquiries', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  message: jsonb('message').notNull(),
  isRead: boolean('is_read').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
export const inquiryReplies = pgTable('contact_inquiry_replies', {
  id: text('id').primaryKey(),
  inquiryId: text('inquiry_id')
    .notNull()
    .references(() => contactInquiries.id, { onDelete: 'cascade' }),
  body: jsonb('body').notNull(),
  sentAt: timestamp('sent_at', { withTimezone: true }).notNull().defaultNow(),
});
export const summaryLinks = pgTable('summary_links', {
  id: text('id').primaryKey(),
  token: text('token').notNull().unique(),
  label: text('label'),
  showSensitiveInfo: boolean('show_sensitive_info').notNull().default(false),
  isActive: boolean('is_active').notNull().default(true),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
export const streamingAccounts = pgTable('streaming_accounts', {
  id: text('id').primaryKey(),
  serviceId: text('service_id')
    .notNull()
    .references(() => services.id, { onDelete: 'cascade' }),
  label: text('label').notNull(),
  email: text('email'),
  phone: text('phone'),
  supportsProfiles: boolean('supports_profiles').notNull().default(true), // e.g. Netflix yes, Spotify no
  maxProfiles: integer('max_profiles').notNull().default(1),
  notes: jsonb('notes'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
export const richTextAssets = pgTable('rich_text_assets', {
  id: text('id').primaryKey(),
  publicId: text('public_id').notNull().unique(),
  url: text('url').notNull(),
  folder: text('folder').notNull(),
  contentType: text('content_type'),
  originalName: text('original_name'),
  size: integer('size'),
  uploadedById: text('uploaded_by_id').references(() => users.id, {
    onDelete: 'set null',
  }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});
export const richTextAssetReferences = pgTable('rich_text_asset_references', {
  id: text('id').primaryKey(),
  publicId: text('public_id')
    .notNull()
    .references(() => richTextAssets.publicId, { onDelete: 'cascade' }),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  fieldName: text('field_name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
export const streamingProfiles = pgTable('streaming_profiles', {
  id: text('id').primaryKey(),
  accountId: text('account_id')
    .notNull()
    .references(() => streamingAccounts.id, { onDelete: 'cascade' }),
  name: text('name').notNull(), // e.g. "Profil 1", "Kids"
  profileIndex: integer('profile_index').notNull().default(1),
  pinEncrypted: text('pin_encrypted'), // AES-256-GCM encrypted PIN (nullable)
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
export const subscriptionProfiles = pgTable('subscription_profiles', {
  id: text('id').primaryKey(),
  subscriptionId: text('subscription_id')
    .notNull()
    .references(() => subscriptions.id, { onDelete: 'cascade' }),
  accountId: text('account_id')
    .notNull()
    .references(() => streamingAccounts.id, { onDelete: 'cascade' }),
  profileId: text('profile_id').references(() => streamingProfiles.id, {
    onDelete: 'set null',
  }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
