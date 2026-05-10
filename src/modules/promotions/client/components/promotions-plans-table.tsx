'use client';

import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { PlanDialog } from '@/modules/promotions/client/components/promotions-plan-dialog';
import type { PlanDto } from '@/lib/graphql/operations/plans.operations';

export function PromotionPlansTable({
  promotionId,
  currency,
}: {
  promotionId: string;
  currency: string;
}) {
  const { data: plans = [] } = usePlans();
  const promotionPlans = plans.filter((p) => p.promotionId === promotionId);
  const createPlan = useCreatePlan();
  const updatePlan = useUpdatePlan();
  const deletePlan = useDeletePlan();
  const [planDialog, setPlanDialog] = useState<{
    open: boolean;
    plan?: PlanDto;
  }>({ open: false });
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          Formules tarifaires
        </p>
        <Button size="sm" variant="outline" onClick={() => setPlanDialog({ open: true })}>
          <Plus className="mr-1 h-3 w-3" /> Ajouter
        </Button>
      </div>
      {promotionPlans.length === 0 ? (
        <p className="text-muted-foreground text-sm italic">
          Aucune formule — ajoutez-en une ci-dessus.
        </p>
      ) : (
        <Table className="table-row-hover">
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Durée</TableHead>
              <TableHead>Prix</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {promotionPlans.map((plan) => (
              <TableRow key={plan.id}>
                <TableCell className="font-medium">{plan.name}</TableCell>
                <TableCell>{plan.durationMonths} mois</TableCell>
                <TableCell>{formatCurrency(plan.price, plan.currencyCode)}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => setPlanDialog({ open: true, plan })}
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

      <PlanDialog
        open={planDialog.open}
        plan={planDialog.plan ?? null}
        defaultCurrency={currency}
        onOpenChange={(o) => setPlanDialog({ open: o })}
        onSubmit={async (data) => {
          await (planDialog.plan
            ? updatePlan.mutateAsync({
                id: planDialog.plan.id,
                input: { ...data, planType: 'bundle' },
              })
            : createPlan.mutateAsync({
                ...data,
                planType: 'bundle',
                promotionId,
              }));
          setPlanDialog({ open: false });
        }}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Supprimer la formule"
        description="Cette action est irréversible."
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
