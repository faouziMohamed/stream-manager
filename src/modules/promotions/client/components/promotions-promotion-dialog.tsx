'use client';

import { useEffect } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import type { Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { FormGroup } from '@/components/ui/form-group';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import {
  promotionSchema,
  toForm,
  type PromotionForm,
  type PromotionDialogProps,
} from './promotions-dialog-types';

export function PromotionDialog({
  open,
  promotion,
  allServices,
  onOpenChange,
  onSubmit,
}: PromotionDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<PromotionForm>({
    resolver: zodResolver(promotionSchema) as Resolver<PromotionForm>,
    defaultValues: {
      serviceMode: 'existing',
      serviceIds: [],
      showOnHomepage: true,
    },
  });

  useEffect(() => {
    if (open) reset(toForm(promotion));
  }, [open, promotion, reset]);

  const isEditing = !!promotion;
  const serviceMode = useWatch({ control, name: 'serviceMode' });
  const selectedIds = useWatch({ control, name: 'serviceIds' }) ?? [];

  const toggleService = (id: string) => {
    setValue(
      'serviceIds',
      selectedIds.includes(id) ? selectedIds.filter((s) => s !== id) : [...selectedIds, id]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{promotion ? 'Modifier la promotion' : 'Nouvelle promotion'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormGroup label="Nom" required error={errors.name?.message}>
            <Input placeholder="ex: Netflix + Shahid VIP" {...register('name')} />
          </FormGroup>

          <FormGroup label="Description" error={errors.description?.message}>
            <Textarea placeholder="Description…" rows={2} {...register('description')} />
          </FormGroup>

          {!isEditing && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Services inclus *</p>
              <div className="flex gap-2 text-sm">
                <button
                  type="button"
                  onClick={() => setValue('serviceMode', 'existing')}
                  className={`rounded border px-3 py-1.5 transition-colors ${serviceMode === 'existing' ? 'bg-primary text-primary-foreground border-primary' : 'border-input hover:bg-accent'}`}
                >
                  Choisir existant
                </button>
                <button
                  type="button"
                  onClick={() => setValue('serviceMode', 'new')}
                  className={`rounded border px-3 py-1.5 transition-colors ${serviceMode === 'new' ? 'bg-primary text-primary-foreground border-primary' : 'border-input hover:bg-accent'}`}
                >
                  Créer un nouveau
                </button>
              </div>

              {serviceMode === 'existing' ? (
                <>
                  {errors.serviceIds && (
                    <p className="text-destructive text-xs">{errors.serviceIds.message}</p>
                  )}
                  {allServices.length === 0 ? (
                    <p className="text-muted-foreground text-sm italic">
                      Aucun service disponible.
                    </p>
                  ) : (
                    <div className="grid max-h-40 grid-cols-2 gap-2 overflow-y-auto rounded-md border p-2">
                      {allServices.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => toggleService(s.id)}
                          className={`rounded border px-2 py-1.5 text-left text-sm transition-colors ${selectedIds.includes(s.id) ? 'bg-primary text-primary-foreground border-primary' : 'border-input hover:bg-accent'}`}
                        >
                          {s.name}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-muted/30 space-y-3 rounded-md border p-3">
                  <FormGroup label="Nom du service" required error={errors.newServiceName?.message}>
                    <Input placeholder="ex: Disney+" {...register('newServiceName')} />
                  </FormGroup>
                  <FormGroup label="Catégorie">
                    <Input
                      placeholder="streaming"
                      defaultValue="streaming"
                      {...register('newServiceCategory')}
                    />
                  </FormGroup>
                </div>
              )}
            </div>
          )}

          {isEditing && (
            <FormGroup label="Services inclus" error={errors.serviceIds?.message}>
              <div className="grid max-h-40 grid-cols-2 gap-2 overflow-y-auto rounded-md border p-2">
                {allServices.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleService(s.id)}
                    className={`rounded border px-2 py-1.5 text-left text-sm transition-colors ${selectedIds.includes(s.id) ? 'bg-primary text-primary-foreground border-primary' : 'border-input hover:bg-accent'}`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </FormGroup>
          )}

          <div className="space-y-3">
            <p className="text-sm font-medium">Période de validité</p>
            <div className="space-y-2">
              <FormGroup label="Date de début" hint="Optionnel">
                <DateTimePicker
                  value={useWatch({ control, name: 'startsAt' })}
                  onChange={(v) => setValue('startsAt', v)}
                  placeholder="Début de la promotion…"
                />
              </FormGroup>
              <FormGroup label="Date d'expiration" hint="Optionnel">
                <DateTimePicker
                  value={useWatch({ control, name: 'expiresAt' })}
                  onChange={(v) => setValue('expiresAt', v)}
                  placeholder="Expiration de la promotion…"
                />
              </FormGroup>
            </div>
            <p className="text-muted-foreground text-xs">
              Une promotion expirée ne s&apos;affiche plus sur la page publique. Les abonnements
              existants restent actifs.
            </p>
          </div>

          <div className="flex items-center justify-between rounded-lg border px-3 py-2.5">
            <div className="space-y-0.5">
              <p className="flex items-center gap-1.5 text-sm font-medium">
                <Eye className="text-muted-foreground h-3.5 w-3.5" />
                Afficher sur la page d&apos;accueil
              </p>
              <p className="text-muted-foreground text-xs">
                Cette promotion sera visible par les visiteurs
              </p>
            </div>
            <Controller
              name="showOnHomepage"
              control={control}
              render={({ field }) => (
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
