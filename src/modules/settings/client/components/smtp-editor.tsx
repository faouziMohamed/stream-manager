'use client';

import { useForm, useWatch } from 'react-hook-form';
import type { Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { FormGroup } from '@/components/ui/form-group';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSetSmtpSettings, useSmtpSettings } from '@/lib/hooks/queries/use-settings.queries';
import type { SmtpSettingsDto } from '@/lib/graphql/operations/settings.operations';
import { SmtpTestSection } from '@/modules/settings/client/components/smtp-test-section';

const smtpSchema = z.object({
  host: z.string().min(1, 'Hôte requis'),
  port: z.coerce.number().int().min(1).max(65_535),
  secure: z.boolean(),
  user: z.string().min(1, 'Utilisateur requis'),
  password: z.string().optional(),
  senderEmail: z.email('Email invalide'),
  senderName: z.string().min(1, 'Nom expéditeur requis'),
});
type SmtpForm = z.infer<typeof smtpSchema>;

interface Props {
  initialSmtp?: SmtpSettingsDto | null;
}

export function SmtpEditor({ initialSmtp }: Props) {
  const { data: smtp } = useSmtpSettings(initialSmtp ?? undefined);
  const setSmtp = useSetSmtpSettings();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<SmtpForm>({
    resolver: zodResolver(smtpSchema) as Resolver<SmtpForm>,
    defaultValues: {
      host: initialSmtp?.host ?? '',
      port: initialSmtp?.port ?? 587,
      secure: initialSmtp?.secure ?? false,
      user: initialSmtp?.user ?? '',
      password: '',
      senderEmail: initialSmtp?.senderEmail ?? '',
      senderName: initialSmtp?.senderName ?? '',
    },
  });

  const onSubmit = async (data: SmtpForm) => {
    await setSmtp.mutateAsync({
      host: data.host,
      port: data.port,
      secure: data.secure,
      user: data.user,
      password: data.password || undefined,
      senderEmail: data.senderEmail,
      senderName: data.senderName,
    });
    form.setValue('password', '');
  };

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Configuration SMTP</h1>
        <p className="text-muted-foreground text-sm">
          Serveur d&apos;envoi d&apos;e-mails. Le mot de passe est chiffré en base de données.
        </p>
      </div>

      {/* ── Config card ───────────────────────────────────────────────── */}
      <Card className="card-hover">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle>Serveur SMTP</CardTitle>
              <CardDescription>Paramètres de connexion au serveur d&apos;envoi.</CardDescription>
            </div>
            {smtp?.hasPassword && (
              <Badge variant="secondary" className="mt-0.5 shrink-0">
                Mot de passe enregistré
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <FormGroup
                label="Hôte SMTP"
                error={form.formState.errors.host?.message}
                className="sm:col-span-2"
              >
                <Input placeholder="smtp-relay.brevo.com" {...form.register('host')} />
              </FormGroup>
              <FormGroup label="Port" error={form.formState.errors.port?.message}>
                <Input type="number" placeholder="587" {...form.register('port')} />
              </FormGroup>
            </div>

            <div className="flex items-center justify-between rounded-lg border px-3 py-2.5">
              <Label className="cursor-pointer text-sm font-medium">
                Connexion sécurisée TLS (port 465)
              </Label>
              <Switch
                checked={useWatch({ control: form.control, name: 'secure' })}
                onCheckedChange={(v) => form.setValue('secure', v)}
              />
            </div>

            <FormGroup label="Utilisateur SMTP" error={form.formState.errors.user?.message}>
              <Input
                placeholder="user@smtp.example.com"
                autoComplete="username"
                {...form.register('user')}
              />
            </FormGroup>

            <FormGroup
              label="Mot de passe"
              hint={smtp?.hasPassword ? "Laisser vide pour conserver l'actuel" : undefined}
              error={form.formState.errors.password?.message}
            >
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={smtp?.hasPassword ? '••••••••' : 'Mot de passe SMTP'}
                  autoComplete="new-password"
                  className="pr-10"
                  {...form.register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2.5 -translate-y-1/2 cursor-pointer transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Masquer' : 'Afficher'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </FormGroup>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormGroup
                label="Email expéditeur"
                error={form.formState.errors.senderEmail?.message}
              >
                <Input
                  type="email"
                  placeholder="contact@example.com"
                  {...form.register('senderEmail')}
                />
              </FormGroup>
              <FormGroup label="Nom expéditeur" error={form.formState.errors.senderName?.message}>
                <Input placeholder="Mon Service" {...form.register('senderName')} />
              </FormGroup>
            </div>

            <Button type="submit" disabled={setSmtp.isPending} className="cursor-pointer">
              {setSmtp.isPending ? 'Enregistrement…' : 'Enregistrer la configuration SMTP'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <SmtpTestSection hasPassword={!!smtp?.hasPassword} />
    </div>
  );
}
