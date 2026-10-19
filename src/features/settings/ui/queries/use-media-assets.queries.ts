'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  deleteMediaAssetAction,
  getMediaAssetsAction,
} from '@/features/settings/server/actions/media-assets.action';
import type { MediaAssetsData } from '@/features/settings/server/loaders/media-assets.loader';
import { useAuthRecoveredOperation } from '@/lib/auth/use-auth-recovered-operation';
import { clientLogger } from '@/lib/logger/client-logger';

export const MEDIA_ASSETS_QUERY_KEY = ['settings', 'media-assets'] as const;

const log = clientLogger('use-media-assets');

export function useMediaAssets(initialData: MediaAssetsData) {
  const recoverOperation = useAuthRecoveredOperation();

  return useQuery({
    initialData,
    queryFn: () => recoverOperation(() => getMediaAssetsAction()),
    queryKey: MEDIA_ASSETS_QUERY_KEY,
  });
}

export function useDeleteMediaAsset() {
  const recoverOperation = useAuthRecoveredOperation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => recoverOperation(() => deleteMediaAssetAction(id)),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: MEDIA_ASSETS_QUERY_KEY });
      const snapshot = queryClient.getQueryData<MediaAssetsData>(MEDIA_ASSETS_QUERY_KEY);
      queryClient.setQueryData<MediaAssetsData>(MEDIA_ASSETS_QUERY_KEY, (previous) => {
        if (previous === undefined) return previous;
        return {
          items: previous.items.filter((asset) => asset.id !== id),
          pageInfo: {
            ...previous.pageInfo,
            total: Math.max(0, previous.pageInfo.total - 1),
          },
        };
      });
      return { snapshot };
    },
    onError: (_error, _id, context) => {
      log.error('Delete media asset failed, rolling back');
      if (context?.snapshot !== undefined) {
        queryClient.setQueryData(MEDIA_ASSETS_QUERY_KEY, context.snapshot);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: MEDIA_ASSETS_QUERY_KEY });
    },
  });
}
