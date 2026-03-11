/**
 * Promote a user to admin by email.
 *
 * Usage:
 *   npm run db:promote -- admin@example.com
 *   # or promote ALL existing users (first-time setup):
 *   npm run db:promote
 */
import "dotenv/config";
import postgres from "postgres";
import {drizzle} from "drizzle-orm/postgres-js";
import {eq} from "drizzle-orm";
import {users} from "@/lib/db/tables/auth.table";

const DATABASE_URL = process.env.DATABASE_URL!;
const DB_SSL_CA = process.env.DB_SSL_CA;

const client = postgres(DATABASE_URL, {
    ssl: DB_SSL_CA ? {ca: DB_SSL_CA} : undefined,
    max: 1,
});
const db = drizzle(client, {schema: {users}});

async function promote() {
    const targetEmail = process.argv[2];

    if (targetEmail) {
        const [updated] = await db
            .update(users)
            .set({role: "admin"})
            .where(eq(users.email, targetEmail))
            .returning({id: users.id, email: users.email, role: users.role});

        if (!updated) {
            console.error(`❌ No user found with email: ${targetEmail}`);
            process.exit(1);
        }
        console.log(`✅ Promoted ${updated.email} → admin`);
    } else {
        // No email provided — promote ALL users (useful for first-time setup)
        const updated = await db
            .update(users)
            .set({role: "admin"})
            .returning({id: users.id, email: users.email, role: users.role});

        if (updated.length === 0) {
            console.log("ℹ️  No users found in the database yet.");
        } else {
            updated.forEach((u) => console.log(`✅ Promoted ${u.email} → admin`));
        }
    }

    await client.end();
}

promote().catch((err) => {
    console.error("❌ Promote failed:", err);
    process.exit(1);
});
