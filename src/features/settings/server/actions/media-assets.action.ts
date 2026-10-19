'use server';

import { loadMediaAssets } from '@/features/settings/server/loaders/media-assets.loader';
import { auth } from '@/lib/auth/auth';
import { gqlRequest } from '@/lib/graphql/client';
import {
  DeleteMediaAssetDocument,
  type DeleteMediaAssetMutation,
  type DeleteMediaAssetMutationVariables,
} from '@/lib/graphql/generated/graphql';
import { createLogger } from '@/lib/logger';

const log = createLogger('media-assets.action');

export async function getMediaAssetsAction() {
  return loadMediaAssets();
}

export async function deleteMediaAssetAction(id: string) {
  const session = await auth();
  if (session === null || session.user?.id === undefined) {
    throw new Error('You must be signed in to delete media');
  }

  const data = await gqlRequest<DeleteMediaAssetMutation, DeleteMediaAssetMutationVariables>(
    DeleteMediaAssetDocument,
    { input: { id } }
  );

  log.info({ id }, 'Media asset deleted');
  return data.deleteMediaAsset;
}
