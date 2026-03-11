import {
    pgTable,
    text,
    timestamp,
    numeric,
    integer,
    boolean,
    pgEnum,
    date,
} from 'drizzle-orm/pg-core';
import {relations} from 'drizzle-orm';

// ─── Enums ────────────────────────────────────────────────────────────────────

export const planTypeEnum = pgEnum('plan_type', [
    'full',
    'partial',
    'custom',
    'bundle',
]);

export const subscriptionStatusEnum = pgEnum('subscription_status', [
    'active',
    'expired',
    'paused',
    'cancelled',
]);

export const paymentStatusEnum = pgEnum('payment_status', [
    'paid',
    'unpaid',
    'overdue',
]);

// ─── App Settings ─────────────────────────────────────────────────────────────

/**
 * Key-value store for app-wide settings (e.g. default currency).
 */
export const appSettings = pgTable('app_settings', {
    key: text('key').primaryKey(),
    value: text('value').notNull(),
    updatedAt: timestamp('updated_at', {withTimezone: true}).notNull().defaultNow(),
});

// ─── Services ─────────────────────────────────────────────────────────────────

/**
 * A streaming service (e.g. Netflix, Shahid VIP, Spotify).
 */
export const services = pgTable('services', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    category: text('category').notNull().default('streaming'),
    description: text('description'),
    logoUrl: text('logo_url'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', {withTimezone: true}).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', {withTimezone: true}).notNull().defaultNow(),
});

// ─── Plans ────────────────────────────────────────────────────────────────────

/**
 * A specific plan for a service (e.g. Netflix 3 months = 119 DH).
 * Plans can belong to a single service OR a promotion (bundle of services).
 */
export const plans = pgTable('plans', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    durationMonths: integer('duration_months').notNull(),
    price: numeric('price', {precision: 10, scale: 2}).notNull(),
    currencyCode: text('currency_code').notNull().default('MAD'),
    planType: planTypeEnum('plan_type').notNull().default('full'),
    description: text('description'),
    isActive: boolean('is_active').notNull().default(true),
    // Either serviceId OR promotionId is set (not both)
    serviceId: text('service_id').references(() => services.id, {onDelete: 'cascade'}),
    promotionId: text('promotion_id').references(() => promotions.id, {onDelete: 'cascade'}),
    createdAt: timestamp('created_at', {withTimezone: true}).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', {withTimezone: true}).notNull().defaultNow(),
});

// ─── Promotions (Bundles) ──────────────────────────────────────────────────────

/**
 * A promotion is a named bundle of multiple services sold at a package price.
 * e.g. "Netflix + Shahid VIP + Prime Video"
 */
export const promotions = pgTable('promotions', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', {withTimezone: true}).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', {withTimezone: true}).notNull().defaultNow(),
});

/**
 * Junction table: which services are included in a promotion.
 */
export const promotionServices = pgTable('promotion_services', {
    id: text('id').primaryKey(),
    promotionId: text('promotion_id')
        .notNull()
        .references(() => promotions.id, {onDelete: 'cascade'}),
    serviceId: text('service_id')
        .notNull()
        .references(() => services.id, {onDelete: 'cascade'}),
});

// ─── Clients ──────────────────────────────────────────────────────────────────

export const clients = pgTable('clients', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email'),
    phone: text('phone'),
    notes: text('notes'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', {withTimezone: true}).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', {withTimezone: true}).notNull().defaultNow(),
});

// ─── Subscriptions ────────────────────────────────────────────────────────────

/**
 * A client's subscription to a plan (single service or promotion bundle).
 * isRecurring: if true, a new subscription is auto-suggested on renewal.
 */
export const subscriptions = pgTable('subscriptions', {
    id: text('id').primaryKey(),
    clientId: text('client_id')
        .notNull()
        .references(() => clients.id, {onDelete: 'cascade'}),
    planId: text('plan_id')
        .notNull()
        .references(() => plans.id, {onDelete: 'restrict'}),
    startDate: date('start_date').notNull(),
    endDate: date('end_date').notNull(),
    isRecurring: boolean('is_recurring').notNull().default(false),
    status: subscriptionStatusEnum('status').notNull().default('active'),
    notes: text('notes'),
    // Track if this is a renewal of a previous subscription
    renewedFromId: text('renewed_from_id'),
    createdAt: timestamp('created_at', {withTimezone: true}).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', {withTimezone: true}).notNull().defaultNow(),
});

// ─── Payments ─────────────────────────────────────────────────────────────────

/**
 * Payment record for a subscription.
 * One payment is created per subscription period.
 * On renewal, a new subscription + payment is created.
 */
export const payments = pgTable('payments', {
    id: text('id').primaryKey(),
    subscriptionId: text('subscription_id')
        .notNull()
        .references(() => subscriptions.id, {onDelete: 'cascade'}),
    dueDate: date('due_date').notNull(),
    paidDate: date('paid_date'),
    amount: numeric('amount', {precision: 10, scale: 2}).notNull(),
    currencyCode: text('currency_code').notNull().default('MAD'),
    status: paymentStatusEnum('status').notNull().default('unpaid'),
    notes: text('notes'),
    createdAt: timestamp('created_at', {withTimezone: true}).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', {withTimezone: true}).notNull().defaultNow(),
});

// ─── Contact Inquiries ────────────────────────────────────────────────────────

export const contactInquiries = pgTable('contact_inquiries', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email'),
    phone: text('phone'),
    message: text('message').notNull(),
    isRead: boolean('is_read').notNull().default(false),
    createdAt: timestamp('created_at', {withTimezone: true}).notNull().defaultNow(),
});

// ─── Shared Summary Links ─────────────────────────────────────────────────────

/**
 * Short shareable links for the read-only accountant summary page.
 */
export const summaryLinks = pgTable('summary_links', {
    id: text('id').primaryKey(),
    token: text('token').notNull().unique(),
    label: text('label'),
    showSensitiveInfo: boolean('show_sensitive_info').notNull().default(false),
    isActive: boolean('is_active').notNull().default(true),
    expiresAt: timestamp('expires_at', {withTimezone: true}),
    createdAt: timestamp('created_at', {withTimezone: true}).notNull().defaultNow(),
});

// ─── Relations ────────────────────────────────────────────────────────────────

export const servicesRelations = relations(services, ({many}) => ({
    plans: many(plans),
    promotionServices: many(promotionServices),
}));

export const promotionsRelations = relations(promotions, ({many}) => ({
    plans: many(plans),
    promotionServices: many(promotionServices),
}));

export const promotionServicesRelations = relations(
    promotionServices,
    ({one}) => ({
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

export const plansRelations = relations(plans, ({one, many}) => ({
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

export const clientsRelations = relations(clients, ({many}) => ({
    subscriptions: many(subscriptions),
}));

export const subscriptionsRelations = relations(
    subscriptions,
    ({one, many}) => ({
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

export const paymentsRelations = relations(payments, ({one}) => ({
    subscription: one(subscriptions, {
        fields: [payments.subscriptionId],
        references: [subscriptions.id],
    }),
}));

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
