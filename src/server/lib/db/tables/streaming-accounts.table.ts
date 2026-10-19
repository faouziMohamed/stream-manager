import { relations } from 'drizzle-orm';
import { boolean, index, integer, pgTable, timestamp, varchar } from 'drizzle-orm/pg-core';

import {
  membershipsTable,
  servicesTable,
} from '@/server/lib/db/tables/membership-management.table';

export const streamingAccountsTable = pgTable(
  'streaming_accounts',
  {
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
    email: varchar('email', { length: 255 }),
    id: varchar('id', { length: 64 }).primaryKey(),
    isActive: boolean('is_active').notNull().default(true),
    label: varchar('label', { length: 255 }).notNull(),
    maxProfiles: integer('max_profiles').notNull().default(1),
    passwordEncrypted: varchar('password_encrypted', { length: 512 }),
    serviceId: varchar('service_id', { length: 64 })
      .notNull()
      .references(() => servicesTable.id, {
        onDelete: 'restrict',
      }),
    supportsProfiles: boolean('supports_profiles').notNull().default(false),
    updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('streaming_accounts_service_id_idx').on(table.serviceId)]
);

export const streamingProfilesTable = pgTable(
  'streaming_profiles',
  {
    accountId: varchar('account_id', { length: 64 })
      .notNull()
      .references(() => streamingAccountsTable.id, {
        onDelete: 'cascade',
      }),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
    id: varchar('id', { length: 64 }).primaryKey(),
    isAssigned: boolean('is_assigned').notNull().default(false),
    name: varchar('name', { length: 255 }).notNull(),
    pinEncrypted: varchar('pin_encrypted', { length: 512 }),
    updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('streaming_profiles_account_id_idx').on(table.accountId)]
);

export const streamingProfileAssignmentsTable = pgTable(
  'streaming_profile_assignments',
  {
    accountId: varchar('account_id', { length: 64 })
      .notNull()
      .references(() => streamingAccountsTable.id, {
        onDelete: 'restrict',
      }),
    assignedAt: timestamp('assigned_at', { mode: 'date', withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
    id: varchar('id', { length: 64 }).primaryKey(),
    membershipId: varchar('membership_id', { length: 64 })
      .notNull()
      .references(() => membershipsTable.id, {
        onDelete: 'restrict',
      }),
    profileId: varchar('profile_id', { length: 64 }).references(() => streamingProfilesTable.id, {
      onDelete: 'set null',
    }),
  },
  (table) => [
    index('assignments_account_id_idx').on(table.accountId),
    index('assignments_membership_id_idx').on(table.membershipId),
    index('assignments_profile_id_idx').on(table.profileId),
  ]
);

export const streamingAccountsRelations = relations(streamingAccountsTable, ({ many, one }) => ({
  profiles: many(streamingProfilesTable),
  assignments: many(streamingProfileAssignmentsTable),
  service: one(servicesTable, {
    fields: [streamingAccountsTable.serviceId],
    references: [servicesTable.id],
  }),
}));

export const streamingProfilesRelations = relations(streamingProfilesTable, ({ many, one }) => ({
  account: one(streamingAccountsTable, {
    fields: [streamingProfilesTable.accountId],
    references: [streamingAccountsTable.id],
  }),
  assignments: many(streamingProfileAssignmentsTable),
}));

export const streamingProfileAssignmentsRelations = relations(
  streamingProfileAssignmentsTable,
  ({ one }) => ({
    account: one(streamingAccountsTable, {
      fields: [streamingProfileAssignmentsTable.accountId],
      references: [streamingAccountsTable.id],
    }),
    membership: one(membershipsTable, {
      fields: [streamingProfileAssignmentsTable.membershipId],
      references: [membershipsTable.id],
    }),
    profile: one(streamingProfilesTable, {
      fields: [streamingProfileAssignmentsTable.profileId],
      references: [streamingProfilesTable.id],
    }),
  })
);
