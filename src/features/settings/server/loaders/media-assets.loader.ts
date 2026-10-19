import { auth } from '@/lib/auth/auth';
import { gqlRequest } from '@/lib/graphql/client';
import {
  MediaAssetsDocument,
  type MediaAssetsQuery,
  type MediaAssetsQueryVariables,
} from '@/lib/graphql/generated/graphql';
import { createLogger } from '@/lib/logger';

const log = createLogger('media-assets.loader');

export type MediaAssetsData = MediaAssetsQuery['mediaAssets'];

export async function loadMediaAssets(): Promise<MediaAssetsData> {
  const empty: MediaAssetsData = {
    items: [],
    pageInfo: { page: 1, pageSize: 100, total: 0, totalPages: 0 },
  };

  try {
    const session = await auth();
    if (session === null || session.user?.id === undefined) {
      log.warn('No session or access token when loading media assets');
      return empty;
    }

    const data = await gqlRequest<MediaAssetsQuery, MediaAssetsQueryVariables>(
      MediaAssetsDocument,
      { input: { page: 1, pageSize: 100 } }
    );
    return data.mediaAssets;
  } catch (error) {
    log.error(
      { error: error instanceof Error ? error.message : String(error) },
      'Failed to load media assets'
    );
    return empty;
  }
}
