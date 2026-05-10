'use client';

import { useForm } from 'react-hook-form';
import type { Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { FormGroup } from '@/components/ui/form-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  useCloudinarySettings,
  useSetCloudinarySettings,
} from '@/lib/hooks/queries/use-settings.queries';
import type { CloudinarySettingsDto } from '@/lib/graphql/operations/settings.operations';

const cloudinarySchema = z.object({
  cloudName: z.string().min(1, 'Cloud name requis'),
  apiKey: z.string().min(1, 'API Key requise'),
  apiSecret: z.string().optional(),
  uploadPreset: z.string().optional(),
  folder: z.string().optional(),
});
type CloudinaryForm = z.infer<typeof cloudinarySchema>;

interface CloudinaryConfigFormProps {
  initialCloudinary?: CloudinarySettingsDto | null;
}

export function CloudinaryConfigForm({ initialCloudinary }: CloudinaryConfigFormProps) {
  const { data: cloudinary } = useCloudinarySettings(initialCloudinary ?? undefined);
  const setCloudinary = useSetCloudinarySettings();
  const [showSecret, setShowSecret] = useState(false);

  const form = useForm<CloudinaryForm>({
    resolver: zodResolver(cloudinarySchema) as Resolver<CloudinaryForm>,
    defaultValues: {
      cloudName: initialCloudinary?.cloudName ?? '',
      apiKey: initialCloudinary?.apiKey ?? '',
      apiSecret: '',
      uploadPreset: initialCloudinary?.uploadPreset ?? '',
      folder: initialCloudinary?.folder ?? 'streammanager',
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
    form.setValue('apiSecret', '');
  };

  const errors = form.formState.errors;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle>Identifiants Cloudinary</CardTitle>
            <CardDescription>
              Retrouvez ces informations dans votre tableau de bord Cloudinary.
            </CardDescription>
          </div>
          {cloudinary?.hasApiSecret && (
            <Badge variant="secondary" className="mt-0.5 shrink-0">
              API Secret enregistré
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormGroup label="Cloud Name" required error={errors.cloudName?.message}>
            <Input id="cloudName" placeholder="my-cloud" {...form.register('cloudName')} />
          </FormGroup>

          <FormGroup label="API Key" required error={errors.apiKey?.message}>
            <Input id="apiKey" placeholder="123456789012345" {...form.register('apiKey')} />
          </FormGroup>

          <FormGroup
            label={
              cloudinary?.hasApiSecret
                ? "API Secret (laisser vide pour conserver l'actuel)"
                : 'API Secret'
            }
            error={errors.apiSecret?.message}
          >
            <div className="relative">
              <Input
                id="apiSecret"
                type={showSecret ? 'text' : 'password'}
                placeholder={
                  cloudinary?.hasApiSecret ? '••••••••••••••••' : 'API Secret Cloudinary'
                }
                autoComplete="new-password"
                className="pr-10"
                {...form.register('apiSecret')}
              />
              <button
                type="button"
                onClick={() => setShowSecret((v) => !v)}
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2.5 -translate-y-1/2 cursor-pointer transition-colors"
                tabIndex={-1}
                aria-label={showSecret ? 'Masquer' : 'Afficher'}
              >
                {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </FormGroup>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormGroup label="Upload Preset" hint="Optionnel" error={errors.uploadPreset?.message}>
              <Input
                id="uploadPreset"
                placeholder="ml_default"
                {...form.register('uploadPreset')}
              />
            </FormGroup>
            <FormGroup label="Dossier par défaut" error={errors.folder?.message}>
              <Input id="folder" placeholder="streammanager" {...form.register('folder')} />
            </FormGroup>
          </div>

          <Button type="submit" disabled={setCloudinary.isPending} className="cursor-pointer">
            {setCloudinary.isPending
              ? 'Enregistrement…'
              : 'Enregistrer la configuration Cloudinary'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
