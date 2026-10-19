import { relations } from 'drizzle-orm';
import { pgEnum, pgTable, timestamp, varchar } from 'drizzle-orm/pg-core';

export const authUserRoleEnum = pgEnum('auth_user_role', ['admin', 'accountant', 'user']);

export const authUsersTable = pgTable('auth_users', {
  avatar: varchar('avatar', { length: 512 }),
  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  id: varchar('id', { length: 64 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  passwordHash: varchar('password_hash', { length: 255 }),
  role: authUserRoleEnum('role').notNull().default('user'),
  updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
});

export const authSessionsTable = pgTable('auth_sessions', {
  browser: varchar('browser', { length: 128 }),
  countryCode: varchar('country_code', { length: 8 }),
  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  deviceType: varchar('device_type', { length: 64 }),
  id: varchar('id', { length: 64 }).primaryKey(),
  ipHash: varchar('ip_hash', { length: 255 }),
  lastUsedAt: timestamp('last_used_at', { mode: 'date', withTimezone: true })
    .defaultNow()
    .notNull(),
  os: varchar('os', { length: 128 }),
  revokedAt: timestamp('revoked_at', { mode: 'date', withTimezone: true }),
  revokedReason: varchar('revoked_reason', { length: 255 }),
  updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  userId: varchar('user_id', { length: 64 })
    .notNull()
    .references(() => authUsersTable.id, { onDelete: 'cascade' }),
});

export const authUsersRelations = relations(authUsersTable, ({ many }) => ({
  sessions: many(authSessionsTable),
}));

export const authSessionsRelations = relations(authSessionsTable, ({ one }) => ({
  user: one(authUsersTable, {
    fields: [authSessionsTable.userId],
    references: [authUsersTable.id],
  }),
}));
