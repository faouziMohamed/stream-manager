import { db } from "@/lib/db";
import {
  appSettings,
  cloudinarySettings,
  contactInquiries,
  smtpSettings,
  summaryLinks,
} from "@/lib/db/tables/subscription-management.table";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { createLogger } from "@/lib/logger";
import { encrypt, safeDecrypt } from "@/lib/utils/crypto";
import type {
  CloudinarySettingsDto,
  SmtpSettingsDto,
} from "@/lib/graphql/operations/settings.operations";

const logger = createLogger("settings-repository");

// ── App settings (key-value) ──────────────────────────────────────────────────

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

// ── SMTP settings ─────────────────────────────────────────────────────────────

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

/** Returns the decrypted SMTP password for internal server use (sending mail). Never expose to client. */
export async function getSmtpPassword(): Promise<string | null> {
  const [row] = await db
    .select()
    .from(smtpSettings)
    .where(eq(smtpSettings.id, "default"));
  if (!row?.passwordEncrypted) return null;
  return safeDecrypt(row.passwordEncrypted);
}

// ── Cloudinary settings ───────────────────────────────────────────────────────

const CLOUDINARY_EMPTY: CloudinarySettingsDto = {
  cloudName: null,
  apiKey: null,
  uploadPreset: null,
  folder: null,
  hasApiSecret: false,
};

export async function getCloudinarySettings(): Promise<CloudinarySettingsDto> {
  try {
    const [row] = await db
      .select()
      .from(cloudinarySettings)
      .where(eq(cloudinarySettings.id, "default"));
    if (!row) return CLOUDINARY_EMPTY;
    return {
      cloudName: row.cloudName,
      apiKey: row.apiKey,
      uploadPreset: row.uploadPreset ?? null,
      folder: row.folder ?? null,
      hasApiSecret: !!row.apiSecretEncrypted,
    };
  } catch {
    return CLOUDINARY_EMPTY;
  }
}

export async function saveCloudinarySettings(input: {
  cloudName: string;
  apiKey: string;
  apiSecret?: string;
  uploadPreset?: string;
  folder?: string;
}): Promise<CloudinarySettingsDto> {
  const existing = await db
    .select()
    .from(cloudinarySettings)
    .where(eq(cloudinarySettings.id, "default"));
  const apiSecretEncrypted = input.apiSecret
    ? encrypt(input.apiSecret)
    : (existing[0]?.apiSecretEncrypted ?? "");

  await db
    .insert(cloudinarySettings)
    .values({
      id: "default",
      cloudName: input.cloudName,
      apiKey: input.apiKey,
      apiSecretEncrypted,
      uploadPreset: input.uploadPreset ?? null,
      folder: input.folder ?? "streammanager",
    })
    .onConflictDoUpdate({
      target: cloudinarySettings.id,
      set: {
        cloudName: input.cloudName,
        apiKey: input.apiKey,
        apiSecretEncrypted,
        uploadPreset: input.uploadPreset ?? null,
        folder: input.folder ?? "streammanager",
        updatedAt: new Date(),
      },
    });
  return {
    cloudName: input.cloudName,
    apiKey: input.apiKey,
    uploadPreset: input.uploadPreset ?? null,
    folder: input.folder ?? "streammanager",
    hasApiSecret: !!apiSecretEncrypted,
  };
}

/** Returns the decrypted API secret for internal server use. Never expose to client. */
export async function getCloudinaryApiSecret(): Promise<string | null> {
  const [row] = await db
    .select()
    .from(cloudinarySettings)
    .where(eq(cloudinarySettings.id, "default"));
  if (!row?.apiSecretEncrypted) return null;
  return safeDecrypt(row.apiSecretEncrypted);
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
    logger.error({ err }, "Failed to save contact inquiry");
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
  return { ...link, shareUrl: `${input.baseUrl}/s/${token}` };
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
    .set({ isActive })
    .where(eq(summaryLinks.id, id))
    .returning();
  return { ...link, shareUrl: `${baseUrl}/s/${link.token}` };
}
