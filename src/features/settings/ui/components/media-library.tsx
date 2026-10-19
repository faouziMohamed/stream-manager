'use client';

import { Copy, ImageIcon, Search, Trash2, Type } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { WithTooltip } from '@/components/console/shared/with-tooltip';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MediaUploader } from '@/features/settings/ui/components/media-uploader';
import type { MediaAssetsData } from '@/features/settings/server/loaders/media-assets.loader';
import {
  useDeleteMediaAsset,
  useMediaAssets,
} from '@/features/settings/ui/queries/use-media-assets.queries';
import { clientLogger } from '@/lib/logger/client-logger';

export function MediaLibrary({ initialData }: { initialData: MediaAssetsData }) {
  const [deleteTarget, setDeleteTarget] = useState<MediaAsset>();
  const [search, setSearch] = useState('');
  const mediaQuery = useMediaAssets(initialData);
  const deleteMutation = useDeleteMediaAsset();
  const normalizedSearch = search.trim().toLowerCase();
  const assets = mediaQuery.data.items.filter((asset) =>
    asset.originalFilename.toLowerCase().includes(normalizedSearch)
  );

  function confirmDelete() {
    if (deleteTarget === undefined) return;
    const target = deleteTarget;
    deleteMutation.mutate(target.id, {
      onSuccess: () => {
        toast.success('Asset deleted', { description: target.originalFilename });
        setDeleteTarget(undefined);
      },
    });
  }

  async function copyUrl(asset: MediaAsset) {
    try {
      await navigator.clipboard.writeText(asset.imageUrl);
      toast.success('Asset URL copied', { description: asset.originalFilename });
    } catch {
      log.error('Unable to copy media URL');
      toast.error('Could not copy the asset URL');
    }
  }

  return (
    <div className="mt-7 space-y-7">
      <MediaUploader />

      <section className="rounded-xl border border-(--sm-border) bg-(--sm-surface) p-5">
        <div className="flex flex-col gap-4 border-b border-(--sm-border) pb-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-(--sm-fg)">Library</h2>
            <p className="mt-1 text-xs text-(--sm-muted) tabular-nums">
              {mediaQuery.data.pageInfo.total} asset
              {mediaQuery.data.pageInfo.total === 1 ? '' : 's'}
            </p>
          </div>
          <div className="relative w-full lg:max-w-sm">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-(--sm-muted)" />
            <Input
              icon={Type}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by filename..."
              className="h-10 border-(--sm-border) bg-(--sm-bg) pl-10"
            />
          </div>
        </div>

        {assets.length > 0 ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {assets.map((asset) => (
              <article
                key={asset.id}
                className="overflow-hidden rounded-lg border border-(--sm-border) bg-(--sm-bg) hover:border-(--sm-border2)"
              >
                <AssetThumbnail alt={asset.originalFilename} src={asset.imageUrl} />
                <div className="border-t border-(--sm-border) p-4">
                  <p className="truncate text-sm font-semibold text-(--sm-fg)">
                    {asset.originalFilename}
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-(--sm-muted)">
                    <span>{formatType(asset.contentType)}</span>
                    <span>·</span>
                    <span>{formatBytes(asset.sizeBytes)}</span>
                    <span>·</span>
                    <span>{formatDate(asset.createdAt)}</span>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void copyUrl(asset)}
                      className="flex-1 border-(--sm-border) bg-(--sm-surface)"
                    >
                      <Copy className="size-3.5" />
                      Copy URL
                    </Button>
                    <WithTooltip label={`Delete ${asset.originalFilename}`}>
                      <Button
                        variant="outline"
                        size="icon-sm"
                        onClick={() => setDeleteTarget(asset)}
                        aria-label={`Delete ${asset.originalFilename}`}
                        className="border-(--sm-border) text-(--sm-muted) hover:border-(--sm-coral) hover:text-(--sm-coral)"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </WithTooltip>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-6 grid min-h-52 place-items-center rounded-xl border border-dashed border-(--sm-border) bg-(--sm-bg)">
            <div className="max-w-sm px-6 text-center">
              <ImageIcon className="mx-auto size-7 text-(--sm-muted)" />
              <p className="mt-4 text-sm font-semibold text-(--sm-fg)">
                {normalizedSearch.length > 0 ? 'No matching assets' : 'Your library is ready'}
              </p>
              <p className="mt-1 text-xs leading-5 text-(--sm-muted)">
                {normalizedSearch.length > 0
                  ? 'Try another filename or clear your search.'
                  : 'Upload your first image above to build a reusable visual inventory.'}
              </p>
            </div>
          </div>
        )}
      </section>

      <AlertDialog
        open={deleteTarget !== undefined}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(undefined);
        }}
      >
        <AlertDialogContent className="border border-(--sm-border) bg-(--sm-surface)">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-(--sm-coral-s) text-(--sm-coral-t)">
              <Trash2 />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete this asset permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              The stored image and its library metadata will be removed. Existing references to this
              URL may stop working.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Keep asset</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteMutation.isPending}
              onClick={confirmDelete}
              variant="accent"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete asset'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

const log = clientLogger('media-library');
type MediaAsset = MediaAssetsData['items'][number];

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short' }).format(new Date(value));
}

function formatType(contentType: string): string {
  return contentType.split('/').at(-1)?.toUpperCase() ?? 'IMAGE';
}

/**
 * A missing object should look missing.
 *
 * The card used to paint the image as a CSS background, so a storage key whose
 * object was gone rendered as a blank rectangle indistinguishable from a slow
 * load. An <img> can report that, and the fallback names the file.
 */
function AssetThumbnail({ alt, src }: { alt: string; src: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="flex aspect-[16/10] flex-col items-center justify-center gap-2 border-b border-(--sm-border) bg-(--sm-surface2) px-4 text-center">
        <ImageIcon className="size-5 text-(--sm-muted)" />
        <p className="text-xs text-(--sm-muted)">Image unavailable in storage</p>
      </div>
    );
  }

  return (
    <Image
      alt={alt}
      className="aspect-[16/10] w-full border-b border-(--sm-border) bg-(--sm-surface2) object-cover"
      height={400}
      onError={() => setFailed(true)}
      src={src}
      unoptimized
      width={640}
    />
  );
}
