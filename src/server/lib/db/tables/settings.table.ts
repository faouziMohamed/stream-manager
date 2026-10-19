import { integer, pgEnum, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';

import { authUsersTable } from '@/server/lib/db/tables/auth.table';

export const notificationStatusEnum = pgEnum('notification_status', ['sent', 'failed']);

export const settingsSummaryLinksTable = pgTable('settings_summary_links', {
  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp('expires_at', { mode: 'date', withTimezone: true }),
  id: varchar('id', { length: 64 }).primaryKey(),
  label: varchar('label', { length: 255 }),
  token: varchar('token', { length: 255 }).notNull().unique(),
});

export const mediaAssetsTable = pgTable('media_assets', {
  contentType: varchar('content_type', { length: 255 }).notNull(),
  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  id: varchar('id', { length: 64 }).primaryKey(),
  originalFilename: varchar('original_filename', { length: 512 }).notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  storageKey: varchar('storage_key', { length: 1024 }).notNull().unique(),
  uploadedByUserId: varchar('uploaded_by_user_id', { length: 64 })
    .notNull()
    .references(() => authUsersTable.id, { onDelete: 'restrict' }),
});

// Audit log of transactional emails sent (membership + payment lifecycle).
export const notificationsEventsTable = pgTable('notifications_events', {
  errorMessage: text('error_message'),
  event: varchar('event', { length: 128 }).notNull(),
  id: varchar('id', { length: 64 }).primaryKey(),
  recipient: varchar('recipient', { length: 255 }).notNull(),
  sentAt: timestamp('sent_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  status: notificationStatusEnum('status').notNull(),
});
