import {eq} from 'drizzle-orm';
import {nanoid} from 'nanoid';
import {db} from '@/lib/db';
import {
    type StreamingAccount,
    streamingAccounts,
    type StreamingProfile,
    streamingProfiles,
    type SubscriptionProfile,
    subscriptionProfiles,
} from '@/lib/db/tables/subscription-management.table';
import {createLogger} from '@/lib/logger';

const logger = createLogger('accounts-repository');

// ─── Accounts ─────────────────────────────────────────────────────────────────

export async function getAllAccounts() {
    return db.select().from(streamingAccounts).orderBy(streamingAccounts.label);
}

export async function getAccountById(id: string) {
    const [row] = await db.select().from(streamingAccounts).where(eq(streamingAccounts.id, id));
    return row ?? null;
}

export async function getAccountsByService(serviceId: string) {
    return db.select().from(streamingAccounts).where(eq(streamingAccounts.serviceId, serviceId));
}

export type CreateAccountInput = {
    serviceId: string;
    label: string;
    email?: string | null;
    password?: string | null;
    maxProfiles?: number;
    notes?: string | null;
};

export async function createAccount(input: CreateAccountInput): Promise<StreamingAccount> {
    const id = nanoid();
    const [row] = await db.insert(streamingAccounts).values({
        id,
        serviceId: input.serviceId,
        label: input.label,
        email: input.email ?? null,
        password: input.password ?? null,
        maxProfiles: input.maxProfiles ?? 1,
        notes: input.notes ?? null,
        isActive: true,
    }).returning();
    logger.info({id}, 'createAccount');
    return row!;
}

export type UpdateAccountInput = Partial<Omit<CreateAccountInput, 'serviceId'> & { isActive: boolean }>;

export async function updateAccount(id: string, input: UpdateAccountInput): Promise<StreamingAccount> {
    const [row] = await db.update(streamingAccounts)
        .set({...input, updatedAt: new Date()})
        .where(eq(streamingAccounts.id, id))
        .returning();
    return row!;
}

export async function deleteAccount(id: string): Promise<boolean> {
    await db.delete(streamingAccounts).where(eq(streamingAccounts.id, id));
    return true;
}

// ─── Profiles ─────────────────────────────────────────────────────────────────

export async function getProfilesByAccount(accountId: string) {
    return db.select().from(streamingProfiles)
        .where(eq(streamingProfiles.accountId, accountId))
        .orderBy(streamingProfiles.profileIndex);
}

export async function getProfileById(id: string) {
    const [row] = await db.select().from(streamingProfiles).where(eq(streamingProfiles.id, id));
    return row ?? null;
}

export type CreateProfileInput = {
    accountId: string;
    name: string;
    profileIndex?: number;
};

export async function createProfile(input: CreateProfileInput): Promise<StreamingProfile> {
    const id = nanoid();
    const [row] = await db.insert(streamingProfiles).values({
        id,
        accountId: input.accountId,
        name: input.name,
        profileIndex: input.profileIndex ?? 1,
        isActive: true,
    }).returning();
    logger.info({id}, 'createProfile');
    return row!;
}

export async function updateProfile(id: string, input: Partial<Omit<CreateProfileInput, 'accountId'> & {
    isActive: boolean
}>): Promise<StreamingProfile> {
    const [row] = await db.update(streamingProfiles)
        .set({...input, updatedAt: new Date()})
        .where(eq(streamingProfiles.id, id))
        .returning();
    return row!;
}

export async function deleteProfile(id: string): Promise<boolean> {
    await db.delete(streamingProfiles).where(eq(streamingProfiles.id, id));
    return true;
}

// ─── Subscription ↔ Profile assignments ──────────────────────────────────────

export async function getAssignmentsBySubscription(subscriptionId: string) {
    return db.select().from(subscriptionProfiles)
        .where(eq(subscriptionProfiles.subscriptionId, subscriptionId));
}

export async function getAssignmentsByAccount(accountId: string) {
    return db.select().from(subscriptionProfiles)
        .where(eq(subscriptionProfiles.accountId, accountId));
}

export async function getAssignmentsByProfile(profileId: string) {
    return db.select().from(subscriptionProfiles)
        .where(eq(subscriptionProfiles.profileId, profileId));
}

export async function assignSubscriptionToProfile(
    subscriptionId: string,
    accountId: string,
    profileId?: string | null,
): Promise<SubscriptionProfile> {
    // Upsert: remove old assignment for this subscription first
    await db.delete(subscriptionProfiles)
        .where(eq(subscriptionProfiles.subscriptionId, subscriptionId));
    const [row] = await db.insert(subscriptionProfiles).values({
        id: nanoid(),
        subscriptionId,
        accountId,
        profileId: profileId ?? null,
    }).returning();
    return row!;
}

export async function removeAssignment(subscriptionId: string): Promise<boolean> {
    await db.delete(subscriptionProfiles)
        .where(eq(subscriptionProfiles.subscriptionId, subscriptionId));
    return true;
}
