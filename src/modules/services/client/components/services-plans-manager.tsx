'use client';

/* eslint-disable react/jsx-max-depth */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ConfirmDialog } from '@/components/console/confirm-dialog';
import { formatCurrency } from '@/lib/utils/helpers';
import {
  useCreatePlan,
  useDeletePlan,
  usePlans,
  useUpdatePlan,
} from '@/lib/hooks/queries/use-services.queries';
import type { PlanDto } from '@/lib/graphql/operations/plans.operations';

// ─── Schema ───────────────────────────────────────────────────────────────────

const planSchema = z.object({
  name: z.string().min(1, 'Nom requis'),
  durationMonths: z.coerce.number().min(1, 'Durée minimale 1 mois'),
  price: z.coerce.number().min(0, 'Prix invalide'),
  currencyCode: z.string().min(1, 'Devise requise'),
  planType: z.enum(['full', 'partial', 'custom', 'bundle']),
  description: z.string().optional(),
});

type PlanForm = {
  name: string;
  durationMonths: number;
  price: number;
  currencyCode: string;
  planType: 'full' | 'partial' | 'custom' | 'bundle';
  description?: string;
};

const planTypeLabels: Record<string, string> = {
  full: 'Complet',
  partial: 'Partiel',
  custom: 'Personnalisé',
  bundle: 'Offre groupée',
};

// ─── Component ────────────────────────────────────────────────────────────────

interface PlansTableProps {
  serviceId: string;
  currency: string;
}

export function PlansTable({ serviceId, currency }: PlansTableProps) {
  const { data: plans = [] } = usePlans(serviceId);
  const createPlan = useCreatePlan();
  const updatePlan = useUpdatePlan();
  const deletePlan = useDeletePlan();

  const [planDialog, setPlanDialog] = useState<{
    open: boolean;
    plan?: PlanDto;
  }>({ open: false });
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PlanForm>({
    resolver: zodResolver(planSchema) as Resolver<PlanForm>,
    defaultValues: { currencyCode: currency, planType: 'full' },
  });

  const openCreate = () => {
    reset({ currencyCode: currency, planType: 'full' });
    setPlanDialog({ open: true });
  };
  const openEdit = (plan: PlanDto) => {
    reset({
      name: plan.name,
      durationMonths: plan.durationMonths,
      price: plan.price,
      currencyCode: plan.currencyCode,
      planType: plan.planType as PlanForm['planType'],
      description: plan.description ?? '',
    });
    setPlanDialog({ open: true, plan });
  };

  const onSubmit = async (data: PlanForm) => {
    await (planDialog.plan
      ? updatePlan.mutateAsync({ id: planDialog.plan.id, input: data })
      : createPlan.mutateAsync({ ...data, serviceId }));
    setPlanDialog({ open: false });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          Formules
        </p>
        <Button size="sm" variant="outline" onClick={openCreate}>
          <Plus className="mr-1 h-3 w-3" /> Ajouter
        </Button>
      </div>
      {plans.length === 0 ? (
        <p className="text-muted-foreground text-sm italic">Aucune formule</p>
      ) : (
        <Table className="table-row-hover">
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Durée</TableHead>
              <TableHead>Prix</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.map((plan) => (
              <TableRow key={plan.id}>
                <TableCell className="font-medium">{plan.name}</TableCell>
                <TableCell>{plan.durationMonths} mois</TableCell>
                <TableCell>{formatCurrency(plan.price, plan.currencyCode)}</TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {planTypeLabels[plan.planType] ?? plan.planType}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => openEdit(plan)}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive h-7 w-7"
                      onClick={() => setDeleteTarget(plan.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={planDialog.open} onOpenChange={(o) => setPlanDialog({ open: o })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {planDialog.plan ? 'Modifier la formule' : 'Nouvelle formule'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label>Nom</Label>
                <Input placeholder="ex: 3 mois" {...register('name')} />
                {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Durée (mois)</Label>
                <Input type="number" min={1} {...register('durationMonths')} />
                {errors.durationMonths && (
                  <p className="text-destructive text-xs">{errors.durationMonths.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Prix</Label>
                <Input type="number" step="0.01" min={0} {...register('price')} />
                {errors.price && <p className="text-destructive text-xs">{errors.price.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Devise</Label>
                <Input placeholder="MAD" {...register('currencyCode')} />
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select
                  defaultValue="full"
                  onValueChange={(v) => setValue('planType', v as PlanForm['planType'])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Complet</SelectItem>
                    <SelectItem value="partial">Partiel</SelectItem>
                    <SelectItem value="custom">Personnalisé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Description (optionnel)</Label>
                <Input placeholder="Détails supplémentaires…" {...register('description')} />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPlanDialog({ open: false })}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Enregistrement…' : 'Enregistrer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Supprimer la formule"
        description="Cette action est irréversible. Les abonnements existants ne seront pas supprimés."
        onConfirm={async () => {
          if (deleteTarget) {
            await deletePlan.mutateAsync(deleteTarget);
            setDeleteTarget(null);
          }
        }}
        loading={deletePlan.isPending}
      />
    </div>
  );
}
