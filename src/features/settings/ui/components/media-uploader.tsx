'use client';

import { FileImage, UploadCloud } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUploadMedia } from '@/features/settings/ui/queries/use-upload-media.mutation';
import {
  imageTooLargeMessage,
  isImageWithinSizeLimit,
  MAX_IMAGE_UPLOAD_BYTES,
} from '@/lib/media/image-upload';

/**
 * Adding an asset is one field and one button.
 *
 * This panel used to be a marketing hero — a radial wash, a glow line, an icon
 * chip, an uppercase kicker and a headline — for a file input. Nothing on it
 * told the operator anything the form did not.
 */
export function MediaUploader() {
  const [inputKey, setInputKey] = useState(0);
  const [selected, setSelected] = useState<File | null>(null);
  const uploadMutation = useUploadMedia();

  function uploadSelected() {
    if (selected === null) return;
    if (!isImageWithinSizeLimit(selected)) {
      toast.error(imageTooLargeMessage(), {
        description: 'Choose a smaller file and try again.',
      });
      return;
    }

    uploadMutation.mutate(
      { category: 'LIBRARY', file: selected },
      {
        onSuccess: (asset) => {
          toast.success('Asset added to the library', {
            description: asset.originalFilename,
          });
          setSelected(null);
          setInputKey((current) => current + 1);
        },
      }
    );
  }

  return (
    <section className="rounded-xl border border-(--sm-border) bg-(--sm-surface) p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold text-(--sm-fg)">Upload an image</h2>
        <p className="text-xs text-(--sm-muted)">
          PNG, JPG, WebP, GIF or AVIF · up to {Math.round(MAX_IMAGE_UPLOAD_BYTES / 1024 / 1024)} MB
        </p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
        <Input
          key={inputKey}
          accept={allowedTypes.join(',')}
          className="h-10"
          onChange={(event) => setSelected(event.target.files?.item(0) ?? null)}
          type="file"
        />
        <Button
          disabled={selected === null || uploadMutation.isPending}
          onClick={() => uploadSelected()}
          variant="accent"
        >
          <UploadCloud className="size-4" />
          {uploadMutation.isPending ? 'Uploading…' : 'Upload'}
        </Button>
      </div>

      {selected === null ? null : (
        <p className="mt-3 flex items-center gap-2 text-xs text-(--sm-muted)">
          <FileImage className="size-3.5 text-(--sm-emerald)" />
          <span className="truncate">{selected.name}</span>
        </p>
      )}
    </section>
  );
}

const allowedTypes = ['image/avif', 'image/gif', 'image/jpeg', 'image/png', 'image/webp'];
