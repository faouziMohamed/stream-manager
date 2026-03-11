import {createEnv} from '@t3-oss/env-nextjs';
import {z} from 'zod';

export const env = createEnv({
    server: {
        DATABASE_URL: z.url(),
        BETTER_AUTH_SECRET: z.string().min(1),
        BETTER_AUTH_URL: z.url(),
        GITHUB_CLIENT_ID: z.string().min(1),
        GITHUB_CLIENT_SECRET: z.string().min(1),
        DB_SSL_CA: z.string().min(1),
        NODE_ENV: z
            .enum(['development', 'test', 'production'])
            .default('development'),
    },
    client: {
        NEXT_PUBLIC_URL: z.url(),
    },
    runtimeEnv: {
        DATABASE_URL: process.env.DATABASE_URL,
        BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
        BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
        GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
        GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
        DB_SSL_CA: process.env.DB_SSL_CA,
        NODE_ENV: process.env.NODE_ENV,
        NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL,
    },
});
