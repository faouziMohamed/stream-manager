import { createLogger } from '@/lib/logger';
import {
  diffRichTextAssetPublicIds,
  extractRichTextAssetPublicIds,
} from '@/components/rich-text/rich-text-utils';
import {
  getCloudinaryApiSecret,
  getCloudinarySettings,
} from '@/modules/settings/server/repositories/cloudinary-settings.repository';
import {
  countRichTextAssetReferences,
  createRichTextAsset,
  findActiveRichTextAssets,
  markRichTextAssetDeleted,
  reconcileRichTextAssetReferences,
  toRichTextAssetDto,
} from '@/modules/rich-text/server/repositories/rich-text-assets.repository';
import type {
  RichTextAssetUploadInput,
  RichTextAssetUploadResult,
} from '@/modules/rich-text/common/rich-text-assets.types';

const logger = createLogger('rich-text-assets-service');
const RICH_TEXT_FOLDER_SEGMENT = 'rich-text';

export async function cleanupUnreferencedRichTextAssets(publicIds: string[]) {
  const assets = await findActiveRichTextAssets(publicIds);

  await Promise.all(
    assets.map(async (asset) => {
      const references = await countRichTextAssetReferences(asset.publicId);
      if (references.length > 0) return;
      await deleteCloudinaryAsset(asset.publicId);
      await markRichTextAssetDeleted(asset.publicId);
    })
  );
}

export async function reconcileRichTextAssets(input: ReconcileRichTextAssetsInput) {
  await reconcileRichTextAssetReferences(input);
}

export async function reconcileSavedRichTextField(input: ReconcileSavedRichTextFieldInput) {
  const publicIds = extractRichTextAssetPublicIds(input.nextValue);
  const diff = diffRichTextAssetPublicIds(input.previousValue, input.nextValue);

  await reconcileRichTextAssetReferences({
    entityId: input.entityId,
    entityType: input.entityType,
    fieldName: input.fieldName,
    publicIds,
  });
  await cleanupUnreferencedRichTextAssets(diff.removed);
}

export async function uploadRichTextAsset(
  input: RichTextAssetUploadInput,
  uploadedById?: string | null
): Promise<RichTextAssetUploadResult> {
  const cloudinary = await getConfiguredCloudinary();
  if (!cloudinary)
    return { asset: null, message: 'Configuration Cloudinary incomplète.', success: false };

  let uploadedPublicId: string | null = null;

  try {
    const filename = input.filename?.replace(/\.[^.]+$/, '') ?? `asset_${Date.now()}`;
    const publicId = `${cloudinary.root}/${RICH_TEXT_FOLDER_SEGMENT}/${filename}_${Date.now()}`;
    const uploadResult = await cloudinary.client.uploader.upload(input.base64, {
      public_id: publicId,
    });
    uploadedPublicId = uploadResult.public_id;
    const asset = await createRichTextAsset({
      publicId: uploadResult.public_id,
      url: uploadResult.secure_url,
      folder: `${cloudinary.root}/${RICH_TEXT_FOLDER_SEGMENT}`,
      contentType: uploadResult.resource_type ? `image/${uploadResult.format}` : null,
      originalName: input.filename ?? null,
      size: uploadResult.bytes ?? null,
      uploadedById,
    });

    logger.info({ publicId: asset.publicId }, 'Rich text asset uploaded');

    return { asset: toRichTextAssetDto(asset), message: 'Image uploadée.', success: true };
  } catch (error) {
    if (uploadedPublicId) await deleteCloudinaryAsset(uploadedPublicId);

    logger.error({ error }, 'Rich text asset upload failed');
    if (isUndefinedRichTextAssetsTableError(error)) {
      return {
        asset: null,
        message: 'Migration rich text non appliquée. Exécutez la migration de base de données.',
        success: false,
      };
    }
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    return { asset: null, message: `Échec : ${message}`, success: false };
  }
}

type ReconcileRichTextAssetsInput = {
  entityId: string;
  entityType: string;
  fieldName: string;
  publicIds: string[];
};

type ReconcileSavedRichTextFieldInput = Omit<ReconcileRichTextAssetsInput, 'publicIds'> & {
  nextValue: unknown;
  previousValue: unknown;
};

async function deleteCloudinaryAsset(publicId: string) {
  if (!publicId.includes(`/${RICH_TEXT_FOLDER_SEGMENT}/`)) return;
  const cloudinary = await getConfiguredCloudinary();
  if (!cloudinary) return;

  const result = await cloudinary.client.uploader.destroy(publicId);
  if (result.result !== 'ok' && result.result !== 'not found') {
    logger.warn({ publicId, result: result.result }, 'Cloudinary asset deletion skipped');
  }
}

async function getConfiguredCloudinary() {
  const settings = await getCloudinarySettings();
  const apiSecret = await getCloudinaryApiSecret();
  if (!settings.cloudName || !settings.apiKey || !apiSecret) return null;

  const { v2: client } = await import('cloudinary');
  client.config({
    cloud_name: settings.cloudName,
    api_key: settings.apiKey,
    api_secret: apiSecret,
  });

  return { client, root: settings.folder ?? 'streammanager' };
}

function isUndefinedRichTextAssetsTableError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const candidate = error as { cause?: unknown; code?: unknown; query?: unknown };
  const query = typeof candidate.query === 'string' ? candidate.query : '';

  if (candidate.code === '42P01' && query.includes('rich_text_assets')) return true;
  return isUndefinedRichTextAssetsTableError(candidate.cause);
}
