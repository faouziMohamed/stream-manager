import { index, jsonb, pgTable, timestamp, varchar } from 'drizzle-orm/pg-core';

import { authUsersTable } from '@/server/lib/db/tables/auth.table';

/**
 * Who did what, appended once and never updated.
 *
 * The domain tables say what is true now; they cannot say who made it true.
 * This table is the trail: one row per completed action, with the actor's
 * identity snapshotted because a user row can be renamed or deleted while the
 * history must keep naming the person who acted. `actor_id` is still linked so
 * a live account can be followed across its actions.
 */
export const auditEventsTable = pgTable(
  'audit_events',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    actorId: varchar('actor_id', { length: 64 }).references(() => authUsersTable.id, {
      onDelete: 'set null',
    }),
    /** Snapshot: survives a deleted or renamed account. */
    actorEmail: varchar('actor_email', { length: 255 }),
    actorRole: varchar('actor_role', { length: 32 }),
    /** Stable verb, e.g. `RenewMembership` or `auth.signed_in`. */
    action: varchar('action', { length: 100 }).notNull(),
    /** Domain noun, e.g. `membership`; null for session-level events. */
    entityType: varchar('entity_type', { length: 64 }),
    entityId: varchar('entity_id', { length: 64 }),
    /** Redacted operation variables — never passwords, PINs or tokens. */
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('audit_events_created_at_idx').on(table.createdAt),
    index('audit_events_actor_id_idx').on(table.actorId),
    index('audit_events_entity_idx').on(table.entityType, table.entityId),
  ]
);
