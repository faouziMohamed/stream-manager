"use client";

import { type Resolver, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCallback, useRef, useState } from "react";
import {
  CheckCircle,
  Eye,
  EyeOff,
  ImageIcon,
  Loader2,
  Trash2,
  UploadCloud,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  useCloudinarySettings,
  useDeleteFromCloudinary,
  useSetCloudinarySettings,
  useUploadToCloudinary,
} from "@/lib/hooks/queries/use-settings.queries";
import type { CloudinarySettingsDto } from "@/lib/graphql/operations/settings.operations";

const cloudinarySchema = z.object({
  cloudName: z.string().min(1, "Cloud name requis"),
  apiKey: z.string().min(1, "API Key requise"),
  apiSecret: z.string().optional(),
  uploadPreset: z.string().optional(),
  folder: z.string().optional(),
});
type CloudinaryForm = z.infer<typeof cloudinarySchema>;

interface UploadedImage {
  publicId: string;
  url: string;
}

interface Props {
  initialCloudinary?: CloudinarySettingsDto | null;
}

export function CloudinaryEditor({ initialCloudinary }: Props) {
  const { data: cloudinary } = useCloudinarySettings(
    initialCloudinary ?? undefined,
  );
  const setCloudinary = useSetCloudinarySettings();
  const uploadMutation = useUploadToCloudinary();
  const deleteMutation = useDeleteFromCloudinary();

  const [showSecret, setShowSecret] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(
    null,
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<CloudinaryForm>({
    resolver: zodResolver(cloudinarySchema) as Resolver<CloudinaryForm>,
    defaultValues: {
      cloudName: initialCloudinary?.cloudName ?? "",
      apiKey: initialCloudinary?.apiKey ?? "",
      apiSecret: "",
      uploadPreset: initialCloudinary?.uploadPreset ?? "",
      folder: initialCloudinary?.folder ?? "streammanager",
    },
  });

  const onSubmit = async (data: CloudinaryForm) => {
    await setCloudinary.mutateAsync({
      cloudName: data.cloudName,
      apiKey: data.apiKey,
      apiSecret: data.apiSecret || undefined,
      uploadPreset: data.uploadPreset || undefined,
      folder: data.folder || undefined,
    });
    form.setValue("apiSecret", "");
  };

  const readFileAsBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        setErrorMsg("Seules les images sont acceptées.");
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
    [uploadMutation],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const onDelete = async () => {
    if (!uploadedImage) return;
    const result = await deleteMutation.mutateAsync(uploadedImage.publicId);
    if (result.success) {
      setUploadedImage(null);
      setPreview(null);
      setDeleteSuccess(true);
    } else {
      setErrorMsg(result.message);
    }
  };

  const resetTest = () => {
    setUploadedImage(null);
    setPreview(null);
    setErrorMsg(null);
    setDeleteSuccess(false);
  };

  const isConfigured = !!cloudinary?.hasApiSecret;

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Configuration Cloudinary</h1>
        <p className="text-muted-foreground text-sm">
          Stockage et gestion des images via l&apos;API Cloudinary. L&apos;API
          Secret est chiffré en base de données.
        </p>
      </div>

      {/* ── Config card ───────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle>Identifiants Cloudinary</CardTitle>
              <CardDescription>
                Retrouvez ces informations dans votre tableau de bord
                Cloudinary.
              </CardDescription>
            </div>
            {cloudinary?.hasApiSecret && (
              <Badge variant="secondary" className="shrink-0 mt-0.5">
                API Secret enregistré
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="cloudName">Cloud Name</Label>
              <Input
                id="cloudName"
                placeholder="my-cloud"
                {...form.register("cloudName")}
              />
              {form.formState.errors.cloudName && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.cloudName.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                placeholder="123456789012345"
                {...form.register("apiKey")}
              />
              {form.formState.errors.apiKey && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.apiKey.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="apiSecret">
                API Secret
                {cloudinary?.hasApiSecret && (
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    (laisser vide pour conserver l&apos;actuel)
                  </span>
                )}
              </Label>
              <div className="relative">
                <Input
                  id="apiSecret"
                  type={showSecret ? "text" : "password"}
                  placeholder={
                    cloudinary?.hasApiSecret
                      ? "••••••••••••••••"
                      : "API Secret Cloudinary"
                  }
                  autoComplete="new-password"
                  className="pr-10"
                  {...form.register("apiSecret")}
                />
                <button
                  type="button"
                  onClick={() => setShowSecret((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  tabIndex={-1}
                  aria-label={showSecret ? "Masquer" : "Afficher"}
                >
                  {showSecret ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="uploadPreset">
                  Upload Preset
                  <span className="ml-1 text-xs font-normal text-muted-foreground">
                    (optionnel)
                  </span>
                </Label>
                <Input
                  id="uploadPreset"
                  placeholder="ml_default"
                  {...form.register("uploadPreset")}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="folder">Dossier par défaut</Label>
                <Input
                  id="folder"
                  placeholder="streammanager"
                  {...form.register("folder")}
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={setCloudinary.isPending}
              className="cursor-pointer"
            >
              {setCloudinary.isPending
                ? "Enregistrement…"
                : "Enregistrer la configuration Cloudinary"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* ── Test card ─────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Tester la configuration</CardTitle>
          <CardDescription>
            Glissez-déposez ou sélectionnez une image pour la téléverser sur
            Cloudinary, la visualiser, puis la supprimer.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isConfigured && (
            <p className="text-sm text-muted-foreground">
              Enregistrez d&apos;abord la configuration avec un API Secret avant
              de tester.
            </p>
          )}

          {isConfigured && !uploadedImage && !uploadMutation.isPending && (
            <>
              {/* Drop zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
                className={`
                                    relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed
                                    px-6 py-10 text-center transition-colors cursor-pointer select-none
                                    ${
                                      isDragging
                                        ? "border-primary bg-primary/5"
                                        : "border-border hover:border-primary/50 hover:bg-muted/40"
                                    }
                                `}
              >
                <UploadCloud
                  className={`h-10 w-10 ${isDragging ? "text-primary" : "text-muted-foreground"}`}
                />
                <div>
                  <p className="font-medium text-sm">
                    Glissez une image ici ou{" "}
                    <span className="text-primary underline">parcourez</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
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
            </>
          )}

          {/* Uploading spinner */}
          {uploadMutation.isPending && (
            <div className="flex items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-10 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-sm">Téléversement en cours…</span>
            </div>
          )}

          {/* Image preview + actions */}
          {uploadedImage && preview && (
            <div className="space-y-3">
              <div className="relative overflow-hidden rounded-xl border bg-muted/30">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={uploadedImage.url}
                  alt="Image téléversée"
                  className="w-full max-h-72 object-contain"
                />
                <div className="absolute top-2 right-2">
                  <Badge variant="secondary" className="gap-1 text-xs">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    Uploadée
                  </Badge>
                </div>
              </div>

              <div className="rounded-lg bg-muted/50 px-3 py-2">
                <p className="text-xs text-muted-foreground font-mono break-all">
                  {uploadedImage.url}
                </p>
                <p className="text-xs text-muted-foreground font-mono mt-0.5 opacity-60">
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

          {/* Delete success */}
          {deleteSuccess && (
            <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
              <CheckCircle className="h-4 w-4 shrink-0" />
              <span>Image supprimée avec succès.</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={resetTest}
                className="ml-auto cursor-pointer h-7 px-2 text-xs"
              >
                Nouveau test
              </Button>
            </div>
          )}

          {/* Error */}
          {errorMsg && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
