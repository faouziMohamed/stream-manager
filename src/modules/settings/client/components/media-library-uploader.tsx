'use client';

import { useCallback, useRef, useState } from 'react';
import { Loader2, Trash2, UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  useDeleteFromCloudinary,
  useReplaceCloudinaryImage,
} from '@/lib/hooks/queries/use-settings.queries';
import { ConfirmDialog } from '@/components/console/confirm-dialog';
import type { CloudinaryResourceDto } from '@/lib/graphql/operations/settings.operations';

function readBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(reader.result as string));
    reader.addEventListener('error', reject);
    reader.readAsDataURL(file);
  });
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function sectionOrder(key: string) {
  if (key === 'logos') return '000_logos';
  if (key === 'avatars') return '001_avatars';
  if (key === '_root_') return 'zzz_root';
  if (key === 'tests') return 'zzz_tests';
  return `500_${key}`;
}

export function sectionLabel(subFolder: string): string {
  const map: Record<string, string> = {
    logos: 'Logos services',
    avatars: 'Avatars',
    uploads: 'Uploads divers',
    tests: 'Images de test',
  };
  return map[subFolder] ?? `Dossier : ${subFolder}`;
}

export function groupBySubFolder(resources: CloudinaryResourceDto[], rootFolder: string) {
  const groups: Record<string, CloudinaryResourceDto[]> = {};
  for (const r of resources) {
    const withoutRoot = r.publicId.startsWith(rootFolder + '/')
      ? r.publicId.slice(rootFolder.length + 1)
      : r.publicId;
    const segment = withoutRoot.includes('/') ? withoutRoot.split('/')[0] : '_root_';
    if (!groups[segment]) groups[segment] = [];
    groups[segment].push(r);
  }
  return groups;
}

export function MediaCard({
  resource,
  onDeleted,
  onReplaced,
}: {
  resource: CloudinaryResourceDto;
  onDeleted: (publicId: string) => void;
  onReplaced: (publicId: string, newUrl: string) => void;
}) {
  const deleteMutation = useDeleteFromCloudinary();
  const replaceMutation = useReplaceCloudinaryImage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [replacing, setReplacing] = useState(false);

  const handleReplaceFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) return;
      setReplacing(true);
      try {
        const base64 = await readBase64(file);
        const result = await replaceMutation.mutateAsync({
          oldPublicId: resource.publicId,
          base64,
          filename: file.name,
        });
        if (result.success && result.url) {
          onReplaced(resource.publicId, result.url);
        }
      } finally {
        setReplacing(false);
      }
    },
    [replaceMutation, resource.publicId, onReplaced]
  );

  const isPending = deleteMutation.isPending || replacing;

  return (
    <>
      <div className="group bg-card card-hover relative flex flex-col overflow-hidden rounded-xl border transition-all duration-200 hover:-translate-y-0.5">
        <div className="bg-muted/40 relative aspect-square overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={resource.url}
            alt={resource.publicId}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              size="sm"
              variant="secondary"
              disabled={isPending}
              onClick={() => fileInputRef.current?.click()}
              className="h-8 cursor-pointer gap-1.5 text-xs"
            >
              {replacing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <UploadCloud className="h-3.5 w-3.5" />
              )}
              Remplacer
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={isPending}
              onClick={() => setConfirmDelete(true)}
              className="h-8 cursor-pointer gap-1.5 text-xs"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
              Supprimer
            </Button>
          </div>
        </div>

        <div className="space-y-0.5 px-2 py-1.5">
          <p className="truncate text-xs font-medium" title={resource.publicId}>
            {resource.publicId.split('/').pop()}
          </p>
          <p className="text-muted-foreground text-xs">
            {resource.width}×{resource.height} · {formatBytes(resource.bytes)} ·{' '}
            {resource.format.toUpperCase()}
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleReplaceFile(f);
            e.target.value = '';
          }}
        />
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Supprimer l'image"
        description="Cette action est irréversible. L'image sera définitivement supprimée de Cloudinary."
        onConfirm={async () => {
          await deleteMutation.mutateAsync(resource.publicId);
          setConfirmDelete(false);
          onDeleted(resource.publicId);
        }}
        loading={deleteMutation.isPending}
      />
    </>
  );
}

export function MediaSection({
  label,
  resources,
  onDeleted,
  onReplaced,
}: {
  label: string;
  resources: CloudinaryResourceDto[];
  onDeleted: (publicId: string) => void;
  onReplaced: (publicId: string, newUrl: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold">{label}</h2>
        <Badge variant="secondary" className="text-xs">
          {resources.length}
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {resources.map((r) => (
          <MediaCard key={r.publicId} resource={r} onDeleted={onDeleted} onReplaced={onReplaced} />
        ))}
      </div>
    </div>
  );
}
