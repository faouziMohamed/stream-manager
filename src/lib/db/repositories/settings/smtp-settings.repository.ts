import { db } from "@/lib/db";
import { smtpSettings } from "@/lib/db/tables/subscription-management.table";
import { eq } from "drizzle-orm";
import { encrypt, safeDecrypt } from "@/lib/utils/crypto";
import type { SmtpSettingsDto } from "@/lib/graphql/operations/settings/smtp-settings.operations";

const SMTP_EMPTY: SmtpSettingsDto = {
  host: null,
  port: null,
  secure: null,
  user: null,
  senderEmail: null,
  senderName: null,
  hasPassword: false,
};

export async function getSmtpSettings(): Promise<SmtpSettingsDto> {
  try {
    const [row] = await db
      .select()
      .from(smtpSettings)
      .where(eq(smtpSettings.id, "default"));
    if (!row) return SMTP_EMPTY;
    return {
      host: row.host,
      port: row.port,
      secure: row.secure,
      user: row.user,
      senderEmail: row.senderEmail,
      senderName: row.senderName,
      hasPassword: !!row.passwordEncrypted,
    };
  } catch {
    return SMTP_EMPTY;
  }
}

export async function saveSmtpSettings(input: {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password?: string;
  senderEmail: string;
  senderName: string;
}): Promise<SmtpSettingsDto> {
  const existing = await db
    .select()
    .from(smtpSettings)
    .where(eq(smtpSettings.id, "default"));
  const passwordEncrypted = input.password
    ? encrypt(input.password)
    : (existing[0]?.passwordEncrypted ?? null);

  await db
    .insert(smtpSettings)
    .values({
      id: "default",
      host: input.host,
      port: input.port,
      secure: input.secure,
      user: input.user,
      passwordEncrypted,
      senderEmail: input.senderEmail,
      senderName: input.senderName,
    })
    .onConflictDoUpdate({
      target: smtpSettings.id,
      set: {
        host: input.host,
        port: input.port,
        secure: input.secure,
        user: input.user,
        passwordEncrypted,
        senderEmail: input.senderEmail,
        senderName: input.senderName,
        updatedAt: new Date(),
      },
    });
  return {
    host: input.host,
    port: input.port,
    secure: input.secure,
    user: input.user,
    senderEmail: input.senderEmail,
    senderName: input.senderName,
    hasPassword: !!passwordEncrypted,
  };
}

export async function getSmtpPassword(): Promise<string | null> {
  const [row] = await db
    .select()
    .from(smtpSettings)
    .where(eq(smtpSettings.id, "default"));
  if (!row?.passwordEncrypted) return null;
  return safeDecrypt(row.passwordEncrypted);
}
