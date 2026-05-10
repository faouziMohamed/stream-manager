"use client";
import { useState } from "react";
import { Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { WorkflowHint } from "@/components/console/workflow-hint";
import { InfoCallout } from "@/components/console/info-callout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDialog } from "@/components/console/confirm-dialog";
import {
  useCreateSubscription,
  useDeleteSubscription,
  useRenewSubscription,
  useSubscriptions,
  useUpdateSubscription,
} from "@/lib/hooks/queries/use-subscriptions.queries";
import { useClients } from "@/lib/hooks/queries/use-clients.queries";
import {
  usePlans,
  useServices,
} from "@/lib/hooks/queries/use-services.queries";
import { usePromotions } from "@/lib/hooks/queries/use-promotions.queries";
import { formatCurrency } from "@/lib/utils/helpers";
import { CreateSubscriptionDialog } from "./subscriptions-create-dialog";
import {
  UpdateSubscriptionDialog,
  RenewSubscriptionDialog,
} from "./subscriptions-dialogs";
import type { CreateForm } from "./subscriptions-create-dialog";
import type { UpdateForm, RenewForm } from "./subscriptions-dialogs";
import type { SubscriptionDto } from "@/lib/graphql/operations/subscriptions.operations";
import type { PlanDto } from "@/lib/graphql/operations/plans.operations";
import type { ServiceDto } from "@/lib/graphql/operations/services.operations";
import type { ClientDto } from "@/lib/graphql/operations/clients.operations";
import type { PromotionDto } from "@/lib/graphql/operations/promotions.operations";

const statusLabels: Record<string, string> = {
  active: "Actif",
  expired: "Expiré",
  paused: "Suspendu",
  cancelled: "Annulé",
};
const statusVariants: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  active: "default",
  expired: "secondary",
  paused: "outline",
  cancelled: "destructive",
};

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  initialData?: SubscriptionDto[];
  initialPlans?: PlanDto[];
  initialServices?: ServiceDto[];
  initialClients?: ClientDto[];
  initialPromotions?: PromotionDto[];
  defaultCurrency?: string;
}

// ─── Main component ───────────────────────────────────────────────────────────
export function SubscriptionsEditor({
  initialData,
  initialPlans,
  initialServices,
  initialClients,
  initialPromotions,
  defaultCurrency = "MAD",
}: Props) {
  const { data: subscriptions = [] } = useSubscriptions(undefined, initialData);
  const { data: clients = [] } = useClients(initialClients);
  const { data: servicePlans = [] } = usePlans(undefined, initialPlans);
  const { data: services = [] } = useServices(initialServices);
  const { data: promotions = [] } = usePromotions(initialPromotions);
  const createSubscription = useCreateSubscription();
  const updateSubscription = useUpdateSubscription();
  const deleteSubscription = useDeleteSubscription();
  const renewSubscription = useRenewSubscription();

  const [createOpen, setCreateOpen] = useState(false);
  const [updateDialog, setUpdateDialog] = useState<{
    open: boolean;
    sub?: SubscriptionDto;
  }>({ open: false });
  const [renewDialog, setRenewDialog] = useState<{
    open: boolean;
    sub?: SubscriptionDto;
  }>({ open: false });
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");

  const allPlans = servicePlans;
  const getPlanLabel = (planId: string) => {
    const plan = allPlans.find((p) => p.id === planId);
    if (!plan) return planId;
    const parent = plan.serviceId
      ? services.find((s) => s.id === plan.serviceId)?.name
      : promotions.find((p) => p.id === plan.promotionId)?.name;
    return `${parent ?? "?"} — ${plan.durationMonths} mois — ${formatCurrency(plan.price, plan.currencyCode)}`;
  };
  const getClientName = (clientId: string) =>
    clients.find((c) => c.id === clientId)?.name ?? "—";

  const filtered =
    statusFilter === "all"
      ? subscriptions
      : subscriptions.filter((s) => s.status === statusFilter);

  const onCreate = async (data: CreateForm) => {
    await createSubscription.mutateAsync(data);
    setCreateOpen(false);
  };

  const onUpdate = async (data: UpdateForm) => {
    if (!updateDialog.sub) return;
    await updateSubscription.mutateAsync({
      id: updateDialog.sub.id,
      input: data,
    });
    setUpdateDialog({ open: false });
  };

  const onRenew = async (data: RenewForm) => {
    if (!renewDialog.sub) return;
    await renewSubscription.mutateAsync({
      subscriptionId: renewDialog.sub.id,
      ...data,
    });
    setRenewDialog({ open: false });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Abonnements</h1>
          <p className="text-muted-foreground text-sm">
            {subscriptions.length} abonnement
            {subscriptions.length !== 1 ? "s" : ""} au total
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvel abonnement
        </Button>
      </div>{" "}
      <WorkflowHint
        steps={[
          { label: "Services", href: "/console/services" },
          { label: "Formules", href: "/console/services" },
          { label: "Abonnements", active: true },
          { label: "Paiements", href: "/console/payments" },
        ]}
      />
      <div className="flex gap-2 flex-wrap">
        {["all", "active", "expired", "paused", "cancelled"].map((s) => (
          <Button
            key={s}
            size="sm"
            variant={statusFilter === s ? "default" : "outline"}
            onClick={() => setStatusFilter(s)}
          >
            {s === "all" ? "Tous" : statusLabels[s]}
          </Button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <InfoCallout variant="info" title="Aucun abonnement trouvé">
          {statusFilter === "all"
            ? "Créez votre premier abonnement pour lier un client à un service. Auparavant, assurez-vous d&apos;avoir créé des services avec leurs formules et des clients."
            : `Aucun abonnement avec le statut &quot;${statusLabels[statusFilter] ?? statusFilter}&quot;.`}
        </InfoCallout>
      ) : (
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Formule</TableHead>
                <TableHead>Début</TableHead>
                <TableHead>Fin</TableHead>
                <TableHead>Récurrent</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="w-28" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell className="font-medium">
                    {sub.client?.name ?? getClientName(sub.clientId)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {getPlanLabel(sub.planId)}
                  </TableCell>
                  <TableCell>{sub.startDate}</TableCell>
                  <TableCell>{sub.endDate}</TableCell>
                  <TableCell>{sub.isRecurring ? "Oui" : "Non"}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariants[sub.status] ?? "secondary"}>
                      {statusLabels[sub.status] ?? sub.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => setUpdateDialog({ open: true, sub })}
                        title="Modifier"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-primary"
                        onClick={() => setRenewDialog({ open: true, sub })}
                        title="Renouveler"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive"
                        onClick={() => setDeleteTarget(sub.id)}
                        title="Supprimer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <CreateSubscriptionDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        clients={clients}
        services={services}
        promotions={promotions}
        plans={allPlans}
        onSubmit={onCreate}
      />
      <UpdateSubscriptionDialog
        open={updateDialog.open}
        sub={updateDialog.sub}
        onOpenChange={(o) => setUpdateDialog({ open: o })}
        onSubmit={onUpdate}
      />
      <RenewSubscriptionDialog
        open={renewDialog.open}
        sub={renewDialog.sub}
        planLabel={
          renewDialog.sub ? getPlanLabel(renewDialog.sub.planId) : undefined
        }
        onOpenChange={(o) => setRenewDialog({ open: o })}
        onSubmit={onRenew}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Supprimer l'abonnement"
        description="Le paiement associé sera également supprimé."
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteSubscription.mutateAsync(deleteTarget);
            setDeleteTarget(null);
          }
        }}
        loading={deleteSubscription.isPending}
      />
    </div>
  );
}
