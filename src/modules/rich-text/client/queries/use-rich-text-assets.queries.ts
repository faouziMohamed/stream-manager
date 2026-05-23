'use client';

import { useMutation } from '@tanstack/react-query';

import { gqlRequest } from '@/lib/graphql/client';
import {
  CLEANUP_RICH_TEXT_ASSETS,
  type RichTextAssetUploadResult,
  UPLOAD_RICH_TEXT_ASSET,
} from '@/modules/rich-text/client/graphql/rich-text-assets.operations';
import { toastError } from '@/lib/utils/toast';

export function useCleanupRichTextAssets() {
  return useMutation({
    mutationFn: (publicIds: string[]) =>
      gqlRequest<{ cleanupRichTextAssets: boolean }>(CLEANUP_RICH_TEXT_ASSETS, {
        publicIds,
      }).then((result) => result.cleanupRichTextAssets),
    onError: (error) => toastError(error, 'Nettoyage des images'),
  });
}

export function useUploadRichTextAsset() {
  return useMutation({
    mutationFn: ({ base64, filename }: { base64: string; filename?: string }) =>
      gqlRequest<{ uploadRichTextAsset: RichTextAssetUploadResult }>(UPLOAD_RICH_TEXT_ASSET, {
        base64,
        filename,
      }).then((result) => result.uploadRichTextAsset),
  });
}
