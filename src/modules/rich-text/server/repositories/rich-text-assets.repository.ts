import { and, eq, inArray, isNull, notInArray } from 'drizzle-orm';
import { nanoid } from 'nanoid';

import { db } from '@/lib/db';
import {
  richTextAssetReferences,
  richTextAssets,
} from '@/lib/db/tables/subscription-management.table';
import type { RichTextAssetDto } from '@/modules/rich-text/common/rich-text-assets.types';

export function countRichTextAssetReferences(publicId: string) {
  return db
    .select({ id: richTextAssetReferences.id })
    .from(richTextAssetReferences)
    .where(eq(richTextAssetReferences.publicId, publicId));
}

export function createRichTextAsset(input: CreateRichTextAssetInput) {
  return db
    .insert(richTextAssets)
    .values({
      id: nanoid(),
      publicId: input.publicId,
      url: input.url,
      folder: input.folder,
      contentType: input.contentType ?? null,
      originalName: input.originalName ?? null,
      size: input.size ?? null,
      uploadedById: input.uploadedById ?? null,
    })
    .returning()
    .then(([asset]) => asset);
}

export function findActiveRichTextAssets(publicIds: string[]) {
  if (publicIds.length === 0) return Promise.resolve([]);

  return db
    .select()
    .from(richTextAssets)
    .where(and(inArray(richTextAssets.publicId, publicIds), isNull(richTextAssets.deletedAt)));
}

export function markRichTextAssetDeleted(publicId: string) {
  return db
    .update(richTextAssets)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(richTextAssets.publicId, publicId));
}

export function reconcileRichTextAssetReferences(input: ReconcileAssetReferencesInput) {
  return db.transaction(async (tx) => {
    const filter = and(
      eq(richTextAssetReferences.entityType, input.entityType),
      eq(richTextAssetReferences.entityId, input.entityId),
      eq(richTextAssetReferences.fieldName, input.fieldName)
    );

    if (input.publicIds.length === 0) {
      await tx.delete(richTextAssetReferences).where(filter);
      return;
    }

    await tx
      .delete(richTextAssetReferences)
      .where(and(filter, notInArray(richTextAssetReferences.publicId, input.publicIds)));

    await tx
      .insert(richTextAssetReferences)
      .values(
        input.publicIds.map((publicId) => ({
          id: nanoid(),
          publicId,
          entityType: input.entityType,
          entityId: input.entityId,
          fieldName: input.fieldName,
        }))
      )
      .onConflictDoNothing();
  });
}

export function toRichTextAssetDto(asset: RichTextAssetRecord): RichTextAssetDto {
  return {
    id: asset.id,
    publicId: asset.publicId,
    url: asset.url,
    folder: asset.folder,
    contentType: asset.contentType,
    originalName: asset.originalName,
    size: asset.size,
    createdAt: asset.createdAt.toISOString(),
  };
}

type CreateRichTextAssetInput = {
  contentType?: string | null;
  folder: string;
  originalName?: string | null;
  publicId: string;
  size?: number | null;
  uploadedById?: string | null;
  url: string;
};

type ReconcileAssetReferencesInput = {
  entityId: string;
  entityType: string;
  fieldName: string;
  publicIds: string[];
};

type RichTextAssetRecord = typeof richTextAssets.$inferSelect;
