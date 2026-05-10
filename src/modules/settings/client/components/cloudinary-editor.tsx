'use client';

import { useCallback, useRef, useState } from 'react';
import type { ChangeEvent, DragEvent } from 'react';
import { CheckCircle, ImageIcon, Loader2, Trash2, UploadCloud, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  useCloudinarySettings,
  useDeleteFromCloudinary,
  useUploadToCloudinary,
} from '@/lib/hooks/queries/use-settings.queries';
import { CloudinaryConfigForm } from '@/modules/settings/client/components/cloudinary-config-form';
import type { CloudinarySettingsDto } from '@/lib/graphql/operations/settings.operations';

interface UploadedImage {
  publicId: string;
  url: string;
}

interface Props {
  initialCloudinary?: CloudinarySettingsDto | null;
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(reader.result as string));
    reader.addEventListener('error', reject);
    reader.readAsDataURL(file);
  });
}

export function CloudinaryEditor({ initialCloudinary }: Props) {
  const { data: cloudinary } = useCloudinarySettings(initialCloudinary ?? undefined);
  const uploadMutation = useUploadToCloudinary();
  const deleteMutation = useDeleteFromCloudinary();

  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) {
        setErrorMsg('Seules les images sont acceptées.');
        return;
      }
      setErrorMsg(null);
      setUploadedImage(null);
      setDeleteSuccess(false);
      const base64 = await readFileAsBase64(file);
      setPreview(base64);
      const result = await uploadMutation.mutateAsync({
        base64,
        filename: file.name,
      });
      if (result.success && result.publicId && result.url) {
        setUploadedImage({ publicId: result.publicId, url: result.url });
      } else {
        setErrorMsg(result.message);
        setPreview(null);
      }
    },
    [uploadMutation]
  );

  const onDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  }

  async function onDelete() {
    if (!uploadedImage) return;
    const result = await deleteMutation.mutateAsync(uploadedImage.publicId);
    if (result.success) {
      setUploadedImage(null);
      setPreview(null);
      setDeleteSuccess(true);
    } else {
      setErrorMsg(result.message);
    }
  }

  function resetTest() {
    setUploadedImage(null);
    setPreview(null);
    setErrorMsg(null);
    setDeleteSuccess(false);
  }

  const isConfigured = !!cloudinary?.hasApiSecret;

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Configuration Cloudinary</h1>
        <p className="text-muted-foreground text-sm">
          Stockage et gestion des images via l&apos;API Cloudinary. L&apos;API Secret est chiffré en
          base de données.
        </p>
      </div>

      <CloudinaryConfigForm initialCloudinary={initialCloudinary} />

      <Card className="card-hover">
        <CardHeader>
          <CardTitle>Tester la configuration</CardTitle>
          <CardDescription>
            Glissez-déposez ou sélectionnez une image pour la téléverser sur Cloudinary, la
            visualiser, puis la supprimer.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isConfigured && (
            <p className="text-muted-foreground text-sm">
              Enregistrez d&apos;abord la configuration avec un API Secret avant de tester.
            </p>
          )}

          {isConfigured && !uploadedImage && !uploadMutation.isPending && (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              className={`relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors select-none ${
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50 hover:bg-muted/40'
              } `}
            >
              <UploadCloud
                className={`h-10 w-10 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`}
              />
              <div>
                <p className="text-sm font-medium">
                  Glissez une image ici ou <span className="text-primary underline">parcourez</span>
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  PNG, JPG, GIF, WebP — max 10 MB
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={onFileChange}
              />
            </div>
          )}

          {uploadMutation.isPending && (
            <div className="text-muted-foreground flex items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-10">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-sm">Téléversement en cours…</span>
            </div>
          )}

          {uploadedImage && preview && (
            <div className="space-y-3">
              <div className="bg-muted/30 relative overflow-hidden rounded-xl border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={uploadedImage.url}
                  alt="Image téléversée"
                  className="max-h-72 w-full object-contain"
                />
                <div className="absolute top-2 right-2">
                  <Badge variant="secondary" className="gap-1 text-xs">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    Uploadée
                  </Badge>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg px-3 py-2">
                <p className="text-muted-foreground font-mono text-xs break-all">
                  {uploadedImage.url}
                </p>
                <p className="text-muted-foreground mt-0.5 font-mono text-xs opacity-60">
                  {uploadedImage.publicId}
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={onDelete}
                  disabled={deleteMutation.isPending}
                  className="cursor-pointer gap-2"
                >
                  {deleteMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Supprimer l&apos;image
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={resetTest}
                  className="cursor-pointer gap-2"
                >
                  <ImageIcon className="h-4 w-4" />
                  Tester une autre image
                </Button>
              </div>
            </div>
          )}

          {deleteSuccess && (
            <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
              <CheckCircle className="h-4 w-4 shrink-0" />
              <span>Image supprimée avec succès.</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={resetTest}
                className="ml-auto h-7 cursor-pointer px-2 text-xs"
              >
                Nouveau test
              </Button>
            </div>
          )}

          {errorMsg && (
            <div className="border-destructive/30 bg-destructive/10 text-destructive flex items-start gap-2 rounded-lg border p-3 text-sm">
              <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
