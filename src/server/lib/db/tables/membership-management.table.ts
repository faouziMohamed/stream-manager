import { relations } from 'drizzle-orm';
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';

export const serviceCategoryEnum = pgEnum('service_category', [
  'video',
  'music',
  'gaming',
  'other',
]);
export const planTypeEnum = pgEnum('plan_type', ['individual', 'shared', 'family']);
export const membershipStatusEnum = pgEnum('membership_status', [
  'active',
  'expired',
  'cancelled',
  'pending',
]);
export const paymentMethodEnum = pgEnum('payment_method', ['cash', 'transfer', 'other']);
export const paymentStatusEnum = pgEnum('payment_status', [
  'unpaid',
  'paid',
  'overdue',
  'cancelled',
]);

export const servicesTable = pgTable('services_services', {
  category: serviceCategoryEnum('category').notNull().default('video'),
  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { mode: 'date', withTimezone: true }),
  descriptionContent: jsonb('description_content'),
  id: varchar('id', { length: 64 }).primaryKey(),
  imageKey: varchar('image_key', { length: 512 }),
  isActive: boolean('is_active').notNull().default(true),
  name: varchar('name', { length: 255 }).notNull().unique(),
  supportsProfiles: boolean('supports_profiles').notNull().default(false),
  updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
});

export const plansTable = pgTable('services_plans', {
  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  currencyCode: varchar('currency_code', { length: 8 }).notNull().default('MAD'),
  descriptionContent: jsonb('description_content'),
  durationMonths: integer('duration_months').notNull(),
  id: varchar('id', { length: 64 }).primaryKey(),
  isActive: boolean('is_active').notNull().default(true),
  name: varchar('name', { length: 255 }).notNull(),
  planType: planTypeEnum('plan_type').notNull().default('individual'),
  price: numeric('price', { precision: 12, scale: 2 }).notNull(),
  serviceId: varchar('service_id', { length: 64 })
    .notNull()
    .references(() => servicesTable.id, {
      onDelete: 'restrict',
    }),
  updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
});

export const customersTable = pgTable('customers_customers', {
  businessId: varchar('business_id', { length: 32 }).notNull().unique(),
  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  email: varchar('email', { length: 255 }),
  id: varchar('id', { length: 64 }).primaryKey(),
  isActive: boolean('is_active').notNull().default(true),
  /** The language this customer's documents are written in. */
  language: varchar('language', { length: 8 }).notNull().default('fr'),
  name: varchar('name', { length: 255 }).notNull(),
  notesContent: jsonb('notes_content'),
  phone: varchar('phone', { length: 64 }),
  updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
});

export const membershipsTable = pgTable(
  'memberships_memberships',
  {
    businessId: varchar('business_id', { length: 32 }).notNull().unique(),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
    customerId: varchar('customer_id', { length: 64 })
      .notNull()
      .references(() => customersTable.id, {
        onDelete: 'restrict',
      }),
    endDate: date('end_date').notNull(),
    id: varchar('id', { length: 64 }).primaryKey(),
    isRecurring: boolean('is_recurring').notNull().default(false),
    planId: varchar('plan_id', { length: 64 })
      .notNull()
      .references(() => plansTable.id, {
        onDelete: 'restrict',
      }),
    renewedFromId: varchar('renewed_from_id', { length: 64 }).references(
      (): AnyPgColumn => membershipsTable.id,
      {
        onDelete: 'set null',
      }
    ),
    startDate: date('start_date').notNull(),
    status: membershipStatusEnum('status').notNull().default('active'),
    updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('memberships_customer_id_idx').on(table.customerId),
    index('memberships_plan_id_idx').on(table.planId),
    index('memberships_renewed_from_id_idx').on(table.renewedFromId),
    index('memberships_status_idx').on(table.status),
  ]
);

export const paymentsTable = pgTable(
  'memberships_payments',
  {
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    businessId: varchar('business_id', { length: 32 }).notNull().unique(),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
    currencyCode: varchar('currency_code', { length: 8 }).notNull().default('MAD'),
    customerId: varchar('customer_id', { length: 64 })
      .notNull()
      .references(() => customersTable.id, {
        onDelete: 'restrict',
      }),
    dueDate: date('due_date').notNull(),
    id: varchar('id', { length: 64 }).primaryKey(),
    membershipId: varchar('membership_id', { length: 64 })
      .notNull()
      .references(() => membershipsTable.id, {
        onDelete: 'cascade',
      }),
    method: paymentMethodEnum('method'),
    notes: text('notes'),
    paidDate: date('paid_date'),
    status: paymentStatusEnum('status').notNull().default('unpaid'),
    updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('payments_customer_id_idx').on(table.customerId),
    index('payments_due_date_idx').on(table.dueDate),
    index('payments_membership_id_idx').on(table.membershipId),
    index('payments_status_idx').on(table.status),
  ]
);

export const servicesRelations = relations(servicesTable, ({ many }) => ({
  plans: many(plansTable),
}));

export const plansRelations = relations(plansTable, ({ one }) => ({
  service: one(servicesTable, {
    fields: [plansTable.serviceId],
    references: [servicesTable.id],
  }),
}));

export const customersRelations = relations(customersTable, ({ many }) => ({
  memberships: many(membershipsTable),
  payments: many(paymentsTable),
}));

export const membershipsRelations = relations(membershipsTable, ({ many, one }) => ({
  customer: one(customersTable, {
    fields: [membershipsTable.customerId],
    references: [customersTable.id],
  }),
  payments: many(paymentsTable),
  plan: one(plansTable, {
    fields: [membershipsTable.planId],
    references: [plansTable.id],
  }),
}));

export const paymentsRelations = relations(paymentsTable, ({ one }) => ({
  customer: one(customersTable, {
    fields: [paymentsTable.customerId],
    references: [customersTable.id],
  }),
  membership: one(membershipsTable, {
    fields: [paymentsTable.membershipId],
    references: [membershipsTable.id],
  }),
}));
