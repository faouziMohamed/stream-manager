"use client";

import { useState } from "react";
import {
  CalendarClock,
  ChevronDown,
  ChevronRight,
  EyeOff,
  Package,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDialog } from "@/components/console/confirm-dialog";
import { formatCurrency } from "@/lib/utils/helpers";
import { toDateTimeString } from "@/lib/utils/date-utils";
import {
  useCreatePromotion,
  useDeletePromotion,
  usePromotions,
  useUpdatePromotion,
} from "@/lib/hooks/queries/use-promotions.queries";
import {
  useCreatePlan,
  useDeletePlan,
  usePlans,
  useServices,
  useUpdatePlan,
} from "@/lib/hooks/queries/use-services.queries";
import {
  PromotionDialog,
  type PromotionForm,
} from "./promotions-promotion-dialog";
import { PlanDialog } from "./promotions-plan-dialog";
import type { PromotionDto } from "@/lib/graphql/operations/promotions.operations";
import type { PlanDto } from "@/lib/graphql/operations/plans.operations";

function formatDate(iso: string | null | undefined) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function promoStatus(promo: PromotionDto) {
  if (!promo.isActive)
    return { label: "Inactive", variant: "secondary" as const };
  if (promo.isExpired)
    return { label: "Expirée", variant: "destructive" as const };
  return { label: "Active", variant: "default" as const };
}

function PromotionPlansTable({
  promotionId,
  currency,
}: {
  promotionId: string;
  currency: string;
}) {
  const { data: plans = [] } = usePlans(undefined);
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
    <div className="space-y-2 mt-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Formules tarifaires
        </p>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setPlanDialog({ open: true })}
        >
          <Plus className="h-3 w-3 mr-1" /> Ajouter
        </Button>
      </div>
      {promotionPlans.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">
          Aucune formule — ajoutez-en une ci-dessus.
        </p>
      ) : (
        <Table>
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
                <TableCell>
                  {formatCurrency(plan.price, plan.currencyCode)}
                </TableCell>
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
                      className="h-7 w-7 text-destructive"
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
          if (planDialog.plan) {
            await updatePlan.mutateAsync({
              id: planDialog.plan.id,
              input: { ...data, planType: "bundle" },
            });
          } else {
            await createPlan.mutateAsync({
              ...data,
              planType: "bundle",
              promotionId,
            });
          }
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

interface Props {
  initialData?: PromotionDto[];
  defaultCurrency?: string;
}

export function PromotionsEditor({
  initialData,
  defaultCurrency = "MAD",
}: Props) {
  const { data: promotions = [] } = usePromotions(initialData);
  const { data: allServices = [] } = useServices();
  const createPromotion = useCreatePromotion();
  const updatePromotion = useUpdatePromotion();
  const deletePromotion = useDeletePromotion();
  const [dialog, setDialog] = useState<{ open: boolean; promo?: PromotionDto }>(
    { open: false },
  );
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handlePromotionSubmit = async (data: PromotionForm) => {
    const startsAt = data.startsAt
      ? toDateTimeString(data.startsAt)
      : undefined;
    const expiresAt = data.expiresAt
      ? toDateTimeString(data.expiresAt)
      : undefined;
    if (dialog.promo) {
      await updatePromotion.mutateAsync({
        id: dialog.promo.id,
        input: {
          name: data.name,
          description: data.description,
          serviceIds: data.serviceIds,
          startsAt,
          expiresAt,
          showOnHomepage: data.showOnHomepage,
        },
      });
    } else {
      await createPromotion.mutateAsync({
        name: data.name,
        description: data.description,
        serviceIds: data.serviceMode === "existing" ? data.serviceIds : [],
        newServiceName:
          data.serviceMode === "new" ? data.newServiceName : undefined,
        newServiceCategory:
          data.serviceMode === "new" ? data.newServiceCategory : undefined,
        startsAt,
        expiresAt,
        showOnHomepage: data.showOnHomepage,
      });
    }
    setDialog({ open: false });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Promotions</h1>
          <p className="text-muted-foreground text-sm">
            Offres groupées combinant plusieurs services
          </p>
        </div>
        <Button onClick={() => setDialog({ open: true })}>
          <Plus className="h-4 w-4 mr-2" /> Nouvelle promotion
        </Button>
      </div>

      {promotions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Aucune promotion. Créez-en une pour commencer.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {promotions.map((promo) => {
            const status = promoStatus(promo);
            const isExpanded = expandedId === promo.id;
            return (
              <Card
                key={promo.id}
                className={
                  promo.isExpired || !promo.isActive ? "opacity-60" : ""
                }
              >
                <CardHeader className="py-3 px-4">
                  <div className="flex items-start justify-between gap-2">
                    <button
                      type="button"
                      className="flex items-center gap-2 font-semibold hover:text-primary transition-colors text-left flex-1 min-w-0"
                      onClick={() =>
                        setExpandedId(isExpanded ? null : promo.id)
                      }
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                      <Package className="h-4 w-4 text-primary shrink-0" />
                      <span className="truncate">{promo.name}</span>
                      <Badge
                        variant={status.variant}
                        className="text-xs shrink-0"
                      >
                        {status.label}
                      </Badge>
                      {promo.showOnHomepage === false && (
                        <Badge
                          variant="outline"
                          className="text-xs text-muted-foreground gap-1 shrink-0"
                        >
                          <EyeOff className="h-3 w-3" /> Masqué
                        </Badge>
                      )}
                    </button>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => setDialog({ open: true, promo })}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive"
                        onClick={() => setDeleteTarget(promo.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="ml-10 flex flex-wrap gap-3 items-center">
                    {promo.description && (
                      <p className="text-xs text-muted-foreground">
                        {promo.description}
                      </p>
                    )}
                    {promo.services && promo.services.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {promo.services.map((s) => (
                          <Badge
                            key={s.id}
                            variant="outline"
                            className="text-xs"
                          >
                            {s.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {(promo.startsAt || promo.expiresAt) && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <CalendarClock className="h-3 w-3" />
                        {promo.startsAt && (
                          <span>Début: {formatDate(promo.startsAt)}</span>
                        )}
                        {promo.startsAt && promo.expiresAt && <span>·</span>}
                        {promo.expiresAt && (
                          <span
                            className={
                              promo.isExpired ? "text-destructive" : ""
                            }
                          >
                            Expire: {formatDate(promo.expiresAt)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="pt-0 pb-4 px-4">
                    <PromotionPlansTable
                      promotionId={promo.id}
                      currency={defaultCurrency}
                    />
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <PromotionDialog
        open={dialog.open}
        promotion={dialog.promo ?? null}
        allServices={allServices}
        onOpenChange={(o) => setDialog({ open: o })}
        onSubmit={handlePromotionSubmit}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Supprimer la promotion"
        description="Toutes les formules associées seront supprimées."
        onConfirm={async () => {
          if (deleteTarget) {
            await deletePromotion.mutateAsync(deleteTarget);
            setDeleteTarget(null);
          }
        }}
        loading={deletePromotion.isPending}
      />
    </div>
  );
}
