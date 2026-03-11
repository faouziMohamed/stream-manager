import { db } from "@/lib/db";
import { cloudinarySettings } from "@/lib/db/tables/subscription-management.table";
import { eq } from "drizzle-orm";
import { encrypt, safeDecrypt } from "@/lib/utils/crypto";
import type { CloudinarySettingsDto } from "@/lib/graphql/operations/settings/cloudinary-settings.operations";

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

export async function getCloudinaryApiSecret(): Promise<string | null> {
  const [row] = await db
    .select()
    .from(cloudinarySettings)
    .where(eq(cloudinarySettings.id, "default"));
  if (!row?.apiSecretEncrypted) return null;
  return safeDecrypt(row.apiSecretEncrypted);
}
