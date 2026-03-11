import {and, count, eq, isNull} from 'drizzle-orm';
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
import {decrypt, encrypt} from '@/lib/utils/encryption';
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
    phone?: string | null;
    supportsProfiles?: boolean;
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
        phone: input.phone ?? null,
        supportsProfiles: input.supportsProfiles ?? true,
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

/** Raw DB row with the encrypted pin — decrypt before returning to callers. */
function decryptProfile(row: StreamingProfile): StreamingProfile & { pin: string | null } {
    return {...row, pin: decrypt(row.pinEncrypted)};
}

export async function getProfilesByAccount(accountId: string) {
    const rows = await db.select().from(streamingProfiles)
        .where(eq(streamingProfiles.accountId, accountId))
        .orderBy(streamingProfiles.profileIndex);
    return rows.map(decryptProfile);
}

export async function getProfileById(id: string) {
    const [row] = await db.select().from(streamingProfiles).where(eq(streamingProfiles.id, id));
    return row ? decryptProfile(row) : null;
}

/** Returns how many profiles exist for an account. */
export async function countProfilesByAccount(accountId: string): Promise<number> {
    const [row] = await db
        .select({value: count()})
        .from(streamingProfiles)
        .where(eq(streamingProfiles.accountId, accountId));
    return row?.value ?? 0;
}

/** Returns how many profiles under an account currently have an active assignment. */
export async function countAssignedProfilesByAccount(accountId: string): Promise<number> {
    const [row] = await db
        .select({value: count()})
        .from(subscriptionProfiles)
        .where(eq(subscriptionProfiles.accountId, accountId));
    return row?.value ?? 0;
}

/** Returns true if a given profileIndex is already taken within the same account (excluding a given profileId). */
export async function profileIndexExistsInAccount(
    accountId: string,
    profileIndex: number,
    excludeProfileId?: string,
): Promise<boolean> {
    const rows = await db
        .select({id: streamingProfiles.id})
        .from(streamingProfiles)
        .where(and(
            eq(streamingProfiles.accountId, accountId),
            eq(streamingProfiles.profileIndex, profileIndex),
        ));
    return rows.some((r) => r.id !== excludeProfileId);
}

export type CreateProfileInput = {
    accountId: string;
    name: string;
    profileIndex?: number;
    pin?: string | null;
};

export async function createProfile(input: CreateProfileInput) {
    const id = nanoid();
    const [row] = await db.insert(streamingProfiles).values({
        id,
        accountId: input.accountId,
        name: input.name,
        profileIndex: input.profileIndex ?? 1,
        pinEncrypted: input.pin ? encrypt(input.pin) : null,
        isActive: true,
    }).returning();
    logger.info({id}, 'createProfile');
    return decryptProfile(row!);
}

export type UpdateProfileInput = Partial<{
    name: string;
    profileIndex: number;
    pin: string | null;
    isActive: boolean;
}>;

export async function updateProfile(id: string, input: UpdateProfileInput) {
    const {pin, ...rest} = input;
    const patch: Record<string, unknown> = {...rest, updatedAt: new Date()};
    // Only update pinEncrypted if pin is explicitly provided (even null to clear it)
    if ('pin' in input) {
        patch.pinEncrypted = pin ? encrypt(pin) : null;
    }
    const [row] = await db.update(streamingProfiles)
        .set(patch)
        .where(eq(streamingProfiles.id, id))
        .returning();
    return decryptProfile(row!);
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

/** For accounts where supportsProfiles=false, returns the account-level assignment (profileId IS NULL). */
export async function getAccountLevelAssignment(accountId: string) {
    const [row] = await db.select().from(subscriptionProfiles)
        .where(and(
            eq(subscriptionProfiles.accountId, accountId),
            isNull(subscriptionProfiles.profileId),
        ));
    return row ?? null;
}

export async function assignSubscriptionToProfile(
    subscriptionId: string,
    accountId: string,
    profileId?: string | null,
): Promise<SubscriptionProfile> {
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
