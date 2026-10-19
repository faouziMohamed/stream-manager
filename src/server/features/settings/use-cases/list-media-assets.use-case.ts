import { paginationMeta } from '@/server/common/utils/pagination';
import { requireAdmin } from '@/server/features/common/guards/require-admin.guard';
import { findMediaAssets } from '@/server/features/settings/repositories/media-assets.repository';
import { resolveImageUrl } from '@/server/features/storage/storage.service';
import type { GqlContext } from '@/server/features/common/schemas/model/context.model';
import type { PaginatedResult } from '@/server/features/common/schemas/model/pagination.model';
import type { MediaAsset } from '@/server/features/settings/repositories/media-assets.repository';
import type { MediaAssetDto } from '@/server/features/settings/schemas/model/media-assets.model';

export async function listMediaAssetsUseCase(
  input: ListMediaAssetsInput,
  context: GqlContext,
  dependencies: ListMediaAssetsDependencies = defaultDependencies
): Promise<PaginatedResult<MediaAssetDto>> {
  requireAdmin(context);

  const result = await dependencies.findMediaAssets(input);
  const items = await Promise.all(
    result.items.map(async (asset) => ({
      ...asset,
      createdAt: asset.createdAt.toISOString(),
      imageUrl: await dependencies.resolveImageUrl(asset.storageKey),
    }))
  );

  return {
    items,
    pageInfo: paginationMeta(result.total, input.page, input.pageSize),
  };
}

interface ListMediaAssetsInput {
  page: number;
  pageSize: number;
}

interface ListMediaAssetsDependencies {
  findMediaAssets: (input: ListMediaAssetsInput) => Promise<{
    items: MediaAsset[];
    total: number;
  }>;
  resolveImageUrl: (key: string) => Promise<string>;
}

const defaultDependencies: ListMediaAssetsDependencies = {
  findMediaAssets,
  resolveImageUrl,
};
