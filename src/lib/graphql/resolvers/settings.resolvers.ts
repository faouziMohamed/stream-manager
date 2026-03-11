import {requireAdmin, requireAuth} from './guards';
import {db} from '@/lib/db';
import {appSettings, contactInquiries, summaryLinks} from '@/lib/db/tables/subscription-management.table';
import {eq} from 'drizzle-orm';
import {nanoid} from 'nanoid';
import {env} from '@/lib/settings/env';
import {createLogger} from '@/lib/logger';
import {getDashboardStats} from '@/lib/db/repositories/analytics.repository';
import type {GraphQLContext} from '../context';

const logger = createLogger('settings-resolvers');

export const settingsResolvers = {
    Query: {
        appSetting: async (
            _: unknown,
            {key}: { key: string },
            ctx: GraphQLContext,
        ) => {
            requireAuth(ctx);
            const [setting] = await db
                .select()
                .from(appSettings)
                .where(eq(appSettings.key, key));
            return setting ?? null;
        },
        defaultCurrency: async () => {
            const [setting] = await db
                .select()
                .from(appSettings)
                .where(eq(appSettings.key, 'defaultCurrency'));
            return setting?.value ?? 'MAD';
        },
        summaryLinks: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
            requireAdmin(ctx);
            return db.select().from(summaryLinks);
        },
        summaryByToken: async (
            _: unknown,
            {token}: { token: string },
        ) => {
            const [link] = await db
                .select()
                .from(summaryLinks)
                .where(eq(summaryLinks.token, token));

            if (!link || !link.isActive) return null;
            if (link.expiresAt && link.expiresAt < new Date()) return null;

            const stats = await getDashboardStats();
            return {
                stats,
                showSensitiveInfo: link.showSensitiveInfo,
            };
        },
    },
    Mutation: {
        setAppSetting: async (
            _: unknown,
            {key, value}: { key: string; value: string },
            ctx: GraphQLContext,
        ) => {
            requireAdmin(ctx);
            await db
                .insert(appSettings)
                .values({key, value})
                .onConflictDoUpdate({target: appSettings.key, set: {value, updatedAt: new Date()}});
            return {key, value};
        },
        setSmtpSettings: async (
            _: unknown,
            {input}: {
                input: {
                    host: string; port: number; secure: boolean;
                    user: string; password?: string;
                    senderEmail: string; senderName: string;
                };
            },
            ctx: GraphQLContext,
        ) => {
            requireAdmin(ctx);
            const upsert = async (key: string, value: string) => {
                await db.insert(appSettings).values({key, value})
                    .onConflictDoUpdate({target: appSettings.key, set: {value, updatedAt: new Date()}});
            };
            await upsert('smtpHost', input.host);
            await upsert('smtpPort', String(input.port));
            await upsert('smtpSecure', String(input.secure));
            await upsert('smtpUser', input.user);
            await upsert('senderEmail', input.senderEmail);
            await upsert('senderName', input.senderName);
            if (input.password) {
                await upsert('smtpPassword', encrypt(input.password));
            }
            logger.info('SMTP settings updated');
            // Fetch stored password to return hasPassword
            const [pw] = await db.select().from(appSettings).where(eq(appSettings.key, 'smtpPassword'));
            return {
                host: input.host,
                port: input.port,
                secure: input.secure,
                user: input.user,
                senderEmail: input.senderEmail,
                senderName: input.senderName,
                hasPassword: !!pw,
            };
        },
        createInquiry: async (
            _: unknown,
            {input}: { input: { name: string; email?: string; phone?: string; message: string } },
        ) => {
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
                logger.error({err}, 'Failed to save contact inquiry');
                return false;
            }
        },
        createSummaryLink: async (
            _: unknown,
            {
                label,
                showSensitiveInfo,
                expiresAt,
            }: { label?: string; showSensitiveInfo: boolean; expiresAt?: string },
            ctx: GraphQLContext,
        ) => {
            requireAdmin(ctx);
            const id = nanoid();
            const token = nanoid(16);
            const baseUrl = env.BETTER_AUTH_URL;
            const [link] = await db
                .insert(summaryLinks)
                .values({
                    id,
                    token,
                    label: label ?? null,
                    showSensitiveInfo,
                    isActive: true,
                    expiresAt: expiresAt ? new Date(expiresAt) : null,
                })
                .returning();
            return {...link, shareUrl: `${baseUrl}/s/${token}`};
        },
        deleteSummaryLink: async (
            _: unknown,
            {id}: { id: string },
            ctx: GraphQLContext,
        ) => {
            requireAdmin(ctx);
            await db.delete(summaryLinks).where(eq(summaryLinks.id, id));
            return true;
        },
        toggleSummaryLink: async (
            _: unknown,
            {id, isActive}: { id: string; isActive: boolean },
            ctx: GraphQLContext,
        ) => {
            requireAdmin(ctx);
            const [link] = await db
                .update(summaryLinks)
                .set({isActive})
                .where(eq(summaryLinks.id, id))
                .returning();
            const baseUrl = env.BETTER_AUTH_URL;
            return {...link, shareUrl: `${baseUrl}/s/${link.token}`};
        },
    },
    SummaryLink: {
        shareUrl: (parent: { token: string }) => {
            return `${env.BETTER_AUTH_URL}/s/${parent.token}`;
        },
    },
};
