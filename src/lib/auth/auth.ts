import {betterAuth} from 'better-auth';
import {drizzleAdapter} from 'better-auth/adapters/drizzle';
import {eq} from 'drizzle-orm';
import {db} from '@/lib/db';
import * as schema from '@/lib/db/schema';
import {env} from '@/lib/settings/env';

export const auth = betterAuth({
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,

    database: drizzleAdapter(db, {
        provider: 'pg',
        schema: {
            user: schema.users,
            session: schema.sessions,
            account: schema.accounts,
            verification: schema.verifications,
        },
    }),

    emailAndPassword: {
        enabled: true,
        requireEmailVerification: false,
    },

    socialProviders: {
        github: {
            clientId: env.GITHUB_CLIENT_ID,
            clientSecret: env.GITHUB_CLIENT_SECRET,
        },
    },

    user: {
        additionalFields: {
            role: {
                type: 'string',
                required: false,
                defaultValue: 'user',
                input: false,
            },
        },
    },

    databaseHooks: {
        user: {
            create: {
                after: async (user) => {
                    // Promote the very first registered user to admin automatically
                    const allUsers = await db.select({id: schema.users.id}).from(schema.users);
                    if (allUsers.length === 1) {
                        await db
                            .update(schema.users)
                            .set({role: 'admin'})
                            .where(eq(schema.users.id, user.id));
                    }
                },
            },
        },
    },
});

export type Auth = typeof auth;
