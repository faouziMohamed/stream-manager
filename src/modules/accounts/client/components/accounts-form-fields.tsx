'use client';

import { useWatch } from 'react-hook-form';
import type { UseFormReturn } from 'react-hook-form';
import { Info } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormGroup } from '@/components/ui/form-group';
import type { AccountFormInput } from '@/modules/accounts/client/components/accounts-types';
import type { ServiceDto } from '@/lib/graphql/operations/services.operations';

export function AccountFormFields({
  form,
  isEdit,
  services,
}: {
  form: UseFormReturn<AccountFormInput>;
  isEdit: boolean;
  services: ServiceDto[];
}) {
  const supportsProfiles = useWatch({
    control: form.control,
    name: 'supportsProfiles',
  });

  return (
    <div className="space-y-4">
      {!isEdit && (
        <FormGroup
          label="Service"
          required
          hint="Service auquel ce compte est rattaché"
          error={form.formState.errors.serviceId?.message}
        >
          <Select onValueChange={(v) => form.setValue('serviceId', v)}>
            <SelectTrigger error={form.formState.errors.serviceId?.message}>
              <SelectValue placeholder="Choisir un service" />
            </SelectTrigger>
            <SelectContent>
              {services.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormGroup>
      )}

      <FormGroup
        label="Libellé"
        required
        hint="Nom d'usage pour identifier ce compte"
        error={form.formState.errors.label?.message}
      >
        <Input
          placeholder="ex: Netflix compte principal"
          {...form.register('label')}
          error={form.formState.errors.label?.message}
        />
      </FormGroup>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FormGroup
          label="Email du compte"
          hint="Email de connexion du compte streaming"
          error={form.formState.errors.email?.message}
        >
          <Input
            type="email"
            placeholder="email@exemple.com"
            {...form.register('email')}
            error={form.formState.errors.email?.message}
          />
        </FormGroup>
        <FormGroup
          label="Téléphone"
          hint="Numéro de téléphone associé au compte"
          error={form.formState.errors.phone?.message}
        >
          <Input
            type="tel"
            placeholder="+212 6XX XXX XXX"
            {...form.register('phone')}
            error={form.formState.errors.phone?.message}
          />
        </FormGroup>
      </div>

      <div className="flex items-center justify-between rounded-md border px-3 py-2.5">
        <div className="space-y-0.5">
          <Label className="flex items-center gap-1 text-sm font-medium">
            Gestion par profils
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="text-muted-foreground h-3.5 w-3.5 cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Certains services permettent plusieurs profils (ex: Netflix, Disney+)</p>
              </TooltipContent>
            </Tooltip>
          </Label>
          <p className="text-muted-foreground text-xs">
            La plateforme supporte plusieurs profils (ex: Netflix, Disney+)
          </p>
        </div>
        <Switch
          checked={!!supportsProfiles}
          onCheckedChange={(v) => {
            form.setValue('supportsProfiles', v);
            if (!v) form.setValue('maxProfiles', 1);
          }}
        />
      </div>

      {supportsProfiles && (
        <FormGroup
          label="Nombre de profils max"
          required
          hint="Limite le nombre de profils attribuables à des abonnés"
          error={form.formState.errors.maxProfiles?.message}
        >
          <Input
            type="number"
            min={1}
            max={20}
            {...form.register('maxProfiles')}
            error={form.formState.errors.maxProfiles?.message}
          />
        </FormGroup>
      )}

      <FormGroup label="Notes" hint="Notes internes visibles uniquement par les administrateurs">
        <Textarea rows={2} placeholder="Notes internes…" {...form.register('notes')} />
      </FormGroup>
    </div>
  );
}
