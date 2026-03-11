import {db} from "@/lib/db";
import {appSettings, contactInquiries, summaryLinks,} from "@/lib/db/tables/subscription-management.table";
import {eq} from "drizzle-orm";
import {nanoid} from "nanoid";
import {createLogger} from "@/lib/logger";
import type {SmtpSettingsDto} from "@/lib/graphql/operations/settings.operations";

const logger = createLogger("settings-repository");

// ── App settings ──────────────────────────────────────────────────────────────

export async function getAppSetting(key: string) {
    try {
        const [setting] = await db
            .select()
            .from(appSettings)
            .where(eq(appSettings.key, key));
        return setting ?? null;
    } catch {
        return null;
    }
}

export async function setAppSetting(key: string, value: string) {
    await db
        .insert(appSettings)
        .values({key, value})
        .onConflictDoUpdate({
            target: appSettings.key,
            set: {value, updatedAt: new Date()},
        });
    return {key, value};
}

export async function getDefaultCurrencySetting(): Promise<string> {
    try {
        const [setting] = await db
            .select()
            .from(appSettings)
            .where(eq(appSettings.key, "defaultCurrency"));
        return setting?.value ?? "MAD";
    } catch {
        return "MAD";
    }
}

const SMTP_KEYS = ['smtpHost', 'smtpPort', 'smtpSecure', 'smtpUser', 'smtpPassword', 'senderEmail', 'senderName'] as const;

export async function getSmtpSettings(): Promise<SmtpSettingsDto> {
    try {
        const results = await Promise.all(
            SMTP_KEYS.map(async (k) => {
                const [row] = await db.select().from(appSettings).where(eq(appSettings.key, k));
                return {key: k, value: row?.value ?? null};
            }),
        );
        const get = (k: string) => results.find((r) => r.key === k)?.value ?? null;
        return {
            host: get('smtpHost'),
            port: get('smtpPort') ? parseInt(get('smtpPort')!) : null,
            secure: get('smtpSecure') ? get('smtpSecure') === 'true' : null,
            user: get('smtpUser'),
            senderEmail: get('senderEmail'),
            senderName: get('senderName'),
            hasPassword: !!get('smtpPassword'),
        };
    } catch {
        return {
            host: null,
            port: null,
            secure: null,
            user: null,
            senderEmail: null,
            senderName: null,
            hasPassword: false
        };
    }
}

// ── Contact inquiries ─────────────────────────────────────────────────────────

export type CreateInquiryInput = {
    name: string;
    email?: string | null;
    phone?: string | null;
    message: string;
};

export async function createContactInquiry(input: CreateInquiryInput) {
    try {
        await db.insert(contactInquiries).values({
            id: nanoid(),
            name: input.name,
            email: input.email ?? null,
            phone: input.phone ?? null,
            message: input.message,
        });
        return true;
    } catch (err) {
        logger.error({err}, "Failed to save contact inquiry");
        return false;
    }
}

// ── Summary links ─────────────────────────────────────────────────────────────

export async function getAllSummaryLinks() {
    try {
        return await db.select().from(summaryLinks);
    } catch {
        return [];
    }
}

export async function getSummaryLinkByToken(token: string) {
    try {
        const [link] = await db
            .select()
            .from(summaryLinks)
            .where(eq(summaryLinks.token, token));
        return link ?? null;
    } catch {
        return null;
    }
}

export type CreateSummaryLinkInput = {
    label?: string | null;
    showSensitiveInfo: boolean;
    expiresAt?: string | null;
    baseUrl: string;
};

export async function createSummaryLink(input: CreateSummaryLinkInput) {
    const id = nanoid();
    const token = nanoid(16);
    const [link] = await db
        .insert(summaryLinks)
        .values({
            id,
            token,
            label: input.label ?? null,
            showSensitiveInfo: input.showSensitiveInfo,
            isActive: true,
            expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
        })
        .returning();
    return {...link, shareUrl: `${input.baseUrl}/s/${token}`};
}

export async function deleteSummaryLink(id: string) {
    await db.delete(summaryLinks).where(eq(summaryLinks.id, id));
}

export async function toggleSummaryLink(
    id: string,
    isActive: boolean,
    baseUrl: string,
) {
    const [link] = await db
        .update(summaryLinks)
        .set({isActive})
        .where(eq(summaryLinks.id, id))
        .returning();
    return {...link, shareUrl: `${baseUrl}/s/${link.token}`};
}
