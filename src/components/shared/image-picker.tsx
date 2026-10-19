'use client';

import { ImageIcon, Loader2, Trash2, UploadCloud } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUploadMedia } from '@/features/settings/ui/queries/use-upload-media.mutation';
import type { MediaCategory } from '@/lib/graphql/generated/graphql';
import { clientLogger } from '@/lib/logger/client-logger';
import { imageTooLargeMessage, isImageWithinSizeLimit } from '@/lib/media/image-upload';

export interface ImagePickerValue {
  key: string;
  url: string;
}

export function ImagePicker({
  previewUrl,
  onChangeAction,
  category,
  disabled = false,
}: {
  previewUrl: string | null;
  onChangeAction: (value: ImagePickerValue | null) => void;
  category: MediaCategory;
  disabled?: boolean;
}) {
  const [inputKey, setInputKey] = useState(0);
  const uploadMutation = useUploadMedia();
  const busy = disabled || uploadMutation.isPending;

  function handleFile(file: File | null) {
    if (file === null) return;
    if (!isImageWithinSizeLimit(file)) {
      toast.error(imageTooLargeMessage());
      setInputKey((current) => current + 1);
      return;
    }
    uploadMutation.mutate(
      { category, file },
      {
        onSuccess: (asset) => onChangeAction({ key: asset.storageKey, url: asset.imageUrl }),
        // The global mutation handler surfaces a friendly toast; just log here.
        onError: () => log.error('Image upload failed'),
      }
    );
    setInputKey((current) => current + 1);
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-(--sm-border) bg-(--sm-bg)">
        {previewUrl === null ? (
          <ImageIcon className="size-5 text-(--sm-muted)" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt="Selected" className="size-full object-cover" />
        )}
      </div>

      <div className="min-w-0 flex-1 space-y-2">
        <Input
          key={inputKey}
          type="file"
          accept={allowedTypes.join(',')}
          disabled={busy}
          onChange={(event) => handleFile(event.target.files?.item(0) ?? null)}
        />
        <div className="flex items-center gap-3">
          {uploadMutation.isPending ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-(--sm-muted)">
              <Loader2 className="size-3.5 animate-spin" /> Uploading…
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs text-(--sm-muted)">
              <UploadCloud className="size-3.5" /> PNG, JPG, WEBP, GIF or AVIF
            </span>
          )}
          {previewUrl !== null && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={() => onChangeAction(null)}
              className="text-destructive hover:text-destructive h-7 gap-1.5 px-2 text-xs"
            >
              <Trash2 className="size-3.5" /> Remove
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

const log = clientLogger('image-picker');
const allowedTypes = ['image/avif', 'image/gif', 'image/jpeg', 'image/png', 'image/webp'];
