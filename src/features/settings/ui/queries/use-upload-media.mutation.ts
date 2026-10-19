'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { uploadMediaAction } from '@/features/settings/server/actions/upload-media.action';
import { MEDIA_ASSETS_QUERY_KEY } from '@/features/settings/ui/queries/use-media-assets.queries';
import { useAuthRecoveredOperation } from '@/lib/auth/use-auth-recovered-operation';
import type { MediaCategory } from '@/lib/graphql/generated/graphql';
import { clientLogger } from '@/lib/logger/client-logger';

const log = clientLogger('use-upload-media');

interface UploadMediaArgs {
  file: File;
  category: MediaCategory;
}

export function useUploadMedia() {
  const recoverOperation = useAuthRecoveredOperation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, category }: UploadMediaArgs) =>
      recoverOperation(() => uploadMediaAction(file, category)),
    onMutate: () => ({ startedAt: Date.now() }),
    // The upload can fail on configuration the operator does not control —
    // the storage credentials, the bucket policy — and a silent failure made
    // the button look broken. The message is shown; it names the cause.
    onError: (error) => {
      log.error('Media upload failed');
      toast.error('Could not upload the image', {
        description: error instanceof Error ? error.message : undefined,
      });
    },
    onSettled: () => {
      log.info('Media upload settled');
      void queryClient.invalidateQueries({ queryKey: MEDIA_ASSETS_QUERY_KEY });
    },
  });
}
