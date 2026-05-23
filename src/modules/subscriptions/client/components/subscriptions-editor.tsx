'use client';
import { useState } from 'react';
import { Pencil, Plus, RefreshCw, Tag, Trash2 } from 'lucide-react';
import { WorkflowHint } from '@/components/console/workflow-hint';
import { InfoCallout } from '@/components/console/info-callout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ConfirmDialog } from '@/components/console/confirm-dialog';
import {
  useCreateSubscription,
  useDeleteSubscription,
  useRenewSubscription,
  useSubscriptions,
  useUpdateSubscription,
} from '@/lib/hooks/queries/use-subscriptions.queries';
import { useClients } from '@/lib/hooks/queries/use-clients.queries';
import { usePlans, useServices } from '@/lib/hooks/queries/use-services.queries';
import { usePromotions } from '@/lib/hooks/queries/use-promotions.queries';
import { formatCurrency, cn } from '@/lib/utils/helpers';
import { CreateSubscriptionDialog } from './subscriptions-create-dialog';
import { UpdateSubscriptionDialog, RenewSubscriptionDialog } from './subscriptions-dialogs';
import type { CreateForm } from './subscriptions-create-dialog';
import type { UpdateForm, RenewForm } from './subscriptions-dialogs';
import type { SubscriptionDto } from '@/lib/graphql/operations/subscriptions.operations';
import type { PlanDto } from '@/lib/graphql/operations/plans.operations';
import type { ServiceDto } from '@/lib/graphql/operations/services.operations';
import type { ClientDto } from '@/lib/graphql/operations/clients.operations';
import type { PromotionDto } from '@/lib/graphql/operations/promotions.operations';
import {
  subscriptionStatusColor,
  subscriptionStatusLabel,
  expiryClass,
  expiryLabel,
} from '@/lib/utils/status-colors';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDaysUntil(date: string): number {
  return Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

// ─── Filter pill types ────────────────────────────────────────────────────────

type FilterKey = 'all' | 'active' | 'expired' | 'paused' | 'cancelled';
const FILTERS: { key: FilterKey; label: string; accentCls: string }[] = [
  { key: 'all', label: 'Tous', accentCls: '' },
  { key: 'active', label: 'Actif', accentCls: 'border-emerald-300 data-[active=true]:bg-emerald-600 data-[active=true]:border-emerald-600 data-[active=true]:text-white text-emerald-700 dark:text-emerald-400' },
  { key: 'expired', label: 'Expiré', accentCls: 'border-slate-300 data-[active=true]:bg-slate-600 data-[active=true]:border-slate-600 data-[active=true]:text-white' },
  { key: 'paused', label: 'Suspendu', accentCls: 'border-amber-300 data-[active=true]:bg-amber-500 data-[active=true]:border-amber-500 data-[active=true]:text-white text-amber-700 dark:text-amber-400' },
  { key: 'cancelled', label: 'Annulé', accentCls: 'border-red-300 data-[active=true]:bg-red-600 data-[active=true]:border-red-600 data-[active=true]:text-white text-red-600 dark:text-red-400' },
];

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  initialData?: SubscriptionDto[];
  initialPlans?: PlanDto[];
  initialServices?: ServiceDto[];
  initialClients?: ClientDto[];
  initialPromotions?: PromotionDto[];
}

// ─── Main component ───────────────────────────────────────────────────────────
export function SubscriptionsEditor({
  initialData,
  initialPlans,
  initialServices,
  initialClients,
  initialPromotions,
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
  const [updateDialog, setUpdateDialog] = useState<{ open: boolean; sub?: SubscriptionDto }>({ open: false });
  const [renewDialog, setRenewDialog] = useState<{ open: boolean; sub?: SubscriptionDto }>({ open: false });
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<FilterKey>('all');

  const getPlanLabel = (planId: string) => {
    const plan = servicePlans.find((p) => p.id === planId);
    if (!plan) return planId;
    const parent = plan.serviceId
      ? services.find((s) => s.id === plan.serviceId)?.name
      : promotions.find((p) => p.id === plan.promotionId)?.name;
    return `${parent ?? '?'} — ${plan.durationMonths} mois — ${formatCurrency(plan.price, plan.currencyCode)}`;
  };
  const getClientName = (clientId: string) => clients.find((c) => c.id === clientId)?.name ?? '—';

  const filtered = statusFilter === 'all' ? subscriptions : subscriptions.filter((s) => s.status === statusFilter);

  // Reactive stat counts
  const activeCount = subscriptions.filter((s) => s.status === 'active').length;
  const expiringSoonCount = subscriptions.filter((s) => {
    const isActiveWithEndDate = s.status === 'active' && Boolean(s.endDate);
    if (!isActiveWithEndDate) return false;
    const d = getDaysUntil(s.endDate);
    return d >= 0 && d <= 30;
  }).length;
  const expiredCount = subscriptions.filter((s) => s.status === 'expired').length;

  const onCreate = async (data: CreateForm) => {
    await createSubscription.mutateAsync(data);
    setCreateOpen(false);
  };

  const onUpdate = async (data: UpdateForm) => {
    if (!updateDialog.sub) return;
    await updateSubscription.mutateAsync({ id: updateDialog.sub.id, input: data });
    setUpdateDialog({ open: false });
  };

  const onRenew = async (data: RenewForm) => {
    if (!renewDialog.sub) return;
    await renewSubscription.mutateAsync({ subscriptionId: renewDialog.sub.id, ...data });
    setRenewDialog({ open: false });
  };

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/30">
              <Tag className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Abonnements</h1>
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            {subscriptions.length} abonnement{subscriptions.length === 1 ? '' : 's'} au total
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nouvel abonnement
        </Button>
      </div>

      {/* ── Stat strip ── */}
      {subscriptions.length > 0 && (
        <div className="flex flex-wrap gap-4 rounded-xl border bg-muted/20 px-4 py-3">
          <div className="flex items-center gap-1.5 text-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="font-semibold text-emerald-700 tabular-nums dark:text-emerald-400">{activeCount}</span>
            <span className="text-muted-foreground">actifs</span>
          </div>
          {expiringSoonCount > 0 && (
            <div className="flex items-center gap-1.5 text-sm">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span className="font-semibold text-amber-600 tabular-nums dark:text-amber-400">{expiringSoonCount}</span>
              <span className="text-muted-foreground">expirent dans 30j</span>
            </div>
          )}
          {expiredCount > 0 && (
            <div className="flex items-center gap-1.5 text-sm">
              <span className="h-2 w-2 rounded-full bg-slate-400" />
              <span className="font-semibold tabular-nums">{expiredCount}</span>
              <span className="text-muted-foreground">expirés</span>
            </div>
          )}
        </div>
      )}

      <WorkflowHint
        title="Cycle de vie des abonnements"
        steps={[
          { label: 'Services', href: '/console/services', description: 'Créez vos offres de streaming' },
          { label: 'Formules', href: '/console/services', description: 'Définissez les prix et durées' },
          { label: 'Abonnements', active: true, description: 'Associez clients et formules' },
          { label: 'Paiements', href: '/console/payments', description: 'Suivez les encaissements' },
        ]}
      />

      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map(({ key, label, accentCls }) => {
          const count =
            key === 'all' ? null : subscriptions.filter((s) => s.status === key).length;
          return (
            <button
              key={key}
              type="button"
              data-active={statusFilter === key}
              onClick={() => setStatusFilter(key)}
              className={cn(
                'flex items-center gap-1.5 rounded-full border px-3.5 py-1 text-sm font-medium transition-colors',
                statusFilter === key
                  ? 'bg-primary border-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground border-border',
                accentCls
              )}
            >
              {label}
              {count !== null && count > 0 && (
                <span className="rounded-full bg-current/15 px-1.5 py-0.5 text-xs font-bold opacity-80">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <InfoCallout variant="info" title="Aucun abonnement trouvé">
          {statusFilter === 'all'
            ? "Créez votre premier abonnement pour lier un client à un service."
            : `Aucun abonnement « ${subscriptionStatusLabel[statusFilter] ?? statusFilter} ».`}
        </InfoCallout>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
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
              {filtered.map((sub) => {
                const daysUntil = sub.endDate ? getDaysUntil(sub.endDate) : 999;
                const statusCls = subscriptionStatusColor[sub.status] ?? subscriptionStatusColor.expired;
                const statusLbl = subscriptionStatusLabel[sub.status] ?? sub.status;
                const expLabel = sub.status === 'active' && sub.endDate ? expiryLabel(daysUntil) : '';
                return (
                  <TableRow
                    key={sub.id}
                    className={cn(
                      sub.status === 'expired' && 'opacity-60',
                    )}
                  >
                    <TableCell className="font-medium">
                      {sub.client?.name ?? getClientName(sub.clientId)}
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-48 truncate text-sm">
                      {getPlanLabel(sub.planId)}
                    </TableCell>
                    <TableCell className="text-sm">{sub.startDate}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className={cn('text-sm', sub.endDate ? expiryClass(daysUntil) : '')}>
                          {sub.endDate ?? '—'}
                        </span>
                        {expLabel && (
                          <span className={cn('text-xs', expiryClass(daysUntil))}>
                            {expLabel}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{sub.isRecurring ? 'Oui' : 'Non'}</TableCell>
                    <TableCell>
                      <Badge className={cn('border text-xs', statusCls)}>
                        {statusLbl}
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
                          className={cn('h-8 w-8', sub.status === 'expired' ? 'text-amber-500 hover:text-amber-600' : 'text-primary')}
                          onClick={() => setRenewDialog({ open: true, sub })}
                          title="Renouveler"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive h-8 w-8"
                          onClick={() => setDeleteTarget(sub.id)}
                          title="Supprimer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
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
        plans={servicePlans}
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
        planLabel={renewDialog.sub ? getPlanLabel(renewDialog.sub.planId) : undefined}
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
