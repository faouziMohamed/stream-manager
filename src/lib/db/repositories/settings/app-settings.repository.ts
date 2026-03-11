import { db } from "@/lib/db";
import { appSettings } from "@/lib/db/tables/subscription-management.table";
import { eq } from "drizzle-orm";

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
    .values({ key, value })
    .onConflictDoUpdate({
      target: appSettings.key,
      set: { value, updatedAt: new Date() },
    });
  return { key, value };
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
