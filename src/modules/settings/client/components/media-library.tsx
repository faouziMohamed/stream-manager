'use client';

import { useState } from 'react';
import { Loader2, RefreshCw, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQueryClient } from '@tanstack/react-query';
import { settingsKeys, useCloudinaryMedia } from '@/lib/hooks/queries/use-settings.queries';
import type { CloudinaryResourceDto } from '@/lib/graphql/operations/settings.operations';
import {
  sectionLabel,
  sectionOrder,
  groupBySubFolder,
  MediaSection,
} from './media-library-uploader';

interface Props {
  rootFolder?: string;
}

export function MediaLibrary({ rootFolder = 'streammanager' }: Props) {
  const qc = useQueryClient();
  const { data: resources = [], isLoading, isFetching, error } = useCloudinaryMedia(rootFolder);
  const [local, setLocal] = useState<CloudinaryResourceDto[] | null>(null);

  const displayed = local ?? resources;
  const groups = groupBySubFolder(displayed, rootFolder);

  const sortedKeys = Object.keys(groups).toSorted((a, b) =>
    sectionOrder(a).localeCompare(sectionOrder(b))
  );

  const handleDeleted = (publicId: string) => {
    setLocal((prev) => (prev ?? resources).filter((r) => r.publicId !== publicId));
  };

  const handleReplaced = (oldPublicId: string, newUrl: string) => {
    setLocal((prev) =>
      (prev ?? resources).map((r) => (r.publicId === oldPublicId ? { ...r, url: newUrl } : r))
    );
  };

  const refresh = () => {
    setLocal(null);
    qc.invalidateQueries({ queryKey: settingsKeys.media(rootFolder) });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Médiathèque</h1>
          <p className="text-muted-foreground text-sm">
            Images stockées sur Cloudinary dans le dossier{' '}
            <code className="bg-muted rounded px-1 text-xs">{rootFolder}</code>. Survolez une image
            pour la remplacer ou la supprimer.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refresh}
          disabled={isFetching}
          className="shrink-0 cursor-pointer gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="border-destructive/30 bg-destructive/10 text-destructive flex items-start gap-3 rounded-lg border px-4 py-3 text-sm">
          <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="space-y-0.5">
            <p className="font-medium">Erreur lors du chargement des images Cloudinary</p>
            <p className="font-mono text-xs break-all opacity-80">{String(error)}</p>
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="text-muted-foreground flex items-center justify-center gap-3 py-20">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Chargement des images…</span>
        </div>
      )}

      {/* Empty */}
      {!isLoading && displayed.length === 0 && (
        <Card className="card-hover">
          <CardContent className="text-muted-foreground py-16 text-center">
            Aucune image trouvée dans ce dossier Cloudinary.
          </CardContent>
        </Card>
      )}

      {/* Sections */}
      {!isLoading &&
        sortedKeys.map((key) => (
          <Card key={key} className="card-hover">
            <CardHeader className="px-4 pt-4 pb-2">
              <CardTitle className="text-base">
                {key === '_root_' ? 'Racine du dossier' : sectionLabel(key)}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <MediaSection
                label=""
                resources={groups[key]}
                onDeleted={handleDeleted}
                onReplaced={handleReplaced}
              />
            </CardContent>
          </Card>
        ))}
    </div>
  );
}
