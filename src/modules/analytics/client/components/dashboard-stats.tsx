'use client';

import Link from 'next/link';
import { AlertCircle, ArrowRight, Clock, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDashboardStats } from '@/lib/hooks/queries/use-analytics.queries';
import { useSubscriptions } from '@/lib/hooks/queries/use-subscriptions.queries';
import { usePayments } from '@/lib/hooks/queries/use-payments.queries';
import { useClients } from '@/lib/hooks/queries/use-clients.queries';
import type { DashboardStatsDto } from '@/lib/graphql/operations/analytics.operations';
import { formatCurrency, cn } from '@/lib/utils/helpers';
import { ROUTES } from '@/lib/config/routes';
import {
  StatCards,
  QuickActions,
} from '@/modules/analytics/client/components/dashboard-stats-cards';
import { subscriptionStatusColor, subscriptionStatusLabel } from '@/lib/utils/status-colors';

interface Props {
  initialData?: DashboardStatsDto;
}

export function DashboardStats({ initialData }: Props) {
  const { data: stats } = useDashboardStats(initialData);
  const { data: subscriptions = [] } = useSubscriptions();
  const { data: payments = [] } = usePayments();
  const { data: clients = [] } = useClients();

  const today = new Date();
  const in30Days = new Date(today);
  in30Days.setDate(today.getDate() + 30);

  const upcomingRenewals = subscriptions
    .filter((s) => s.status === 'active' && s.endDate)
    .filter((s) => {
      const end = new Date(s.endDate);
      return end >= today && end <= in30Days;
    })
    .toSorted((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())
    .slice(0, 5);

  const overduePayments = payments
    .filter((p) => p.status === 'overdue')
    .toSorted((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5);

  const recentSubscriptions = [...subscriptions]
    .toSorted((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const getClientName = (clientId: string) =>
    clients.find((c) => c.id === clientId)?.name ?? 'Client inconnu';

  const formatDate = (date: string | Date) =>
    new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

  const getDaysUntil = (date: string | Date) =>
    Math.ceil((new Date(date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tableau de bord</h1>
        <p className="text-muted-foreground text-sm">Vue d&apos;ensemble de votre activité</p>
      </div>

      <StatCards stats={stats} />

      {/* ── Quick actions ──────────────────────────────────────────────────── */}
      <div>
        <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wider uppercase">
          Actions rapides
        </p>
        <QuickActions />
      </div>

      {/* ── Urgent alerts ─────────────────────────────────────────────────── */}
      {overduePayments.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800/50 dark:bg-red-950/20">
          <div className="mb-3 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <span className="text-sm font-semibold text-red-700 dark:text-red-300">
              {overduePayments.length} paiement{overduePayments.length > 1 ? 's' : ''} en retard
            </span>
            <Button asChild variant="ghost" size="sm" className="ml-auto h-7 text-xs text-red-600 hover:text-red-700 dark:text-red-400">
              <Link href={ROUTES.console.payments}>Gérer <ArrowRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </div>
          <div className="space-y-2">
            {overduePayments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between text-sm">
                <span className="font-medium text-red-800 dark:text-red-200">
                  {payment.subscription?.client?.name ?? 'Client inconnu'}
                </span>
                <span className="font-semibold text-red-700 tabular-nums dark:text-red-300">
                  {formatCurrency(Number(payment.amount), payment.currencyCode)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Upcoming renewals */}
        <Card className="card-hover border-l-4 border-l-amber-400">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4 text-amber-500" />
              Renouvellements à venir
              {upcomingRenewals.length > 0 && (
                <Badge className="ml-auto bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                  {upcomingRenewals.length}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>Expirent dans les 30 prochains jours</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingRenewals.length === 0 ? (
              <p className="text-muted-foreground text-sm italic">Aucun renouvellement imminent</p>
            ) : (
              <div className="space-y-2">
                {upcomingRenewals.map((sub) => {
                  const daysLeft = getDaysUntil(sub.endDate);
                  return (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between border-b pb-2 text-sm last:border-0"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{getClientName(sub.clientId)}</p>
                        <p className="text-muted-foreground text-xs">
                          Expire le {formatDate(sub.endDate)}
                        </p>
                      </div>
                      <div className="ml-2 flex items-center gap-2 shrink-0">
                        <Badge
                          variant={daysLeft <= 7 ? 'destructive' : 'secondary'}
                        >
                          {daysLeft}j
                        </Badge>
                        <Button asChild variant="ghost" size="sm" className="h-6 px-2 text-xs text-amber-600 hover:text-amber-700 dark:text-amber-400">
                          <Link href={ROUTES.console.subscriptions}>
                            <RefreshCw className="h-3 w-3" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  );
                })}
                <Button asChild variant="ghost" size="sm" className="mt-1 w-full cursor-pointer">
                  <Link href={ROUTES.console.subscriptions}>
                    Voir tout <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Overdue payments */}
        <Card className={cn('card-hover', overduePayments.length > 0 ? 'border-l-4 border-l-red-500' : '')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertCircle className={cn('h-4 w-4', overduePayments.length > 0 ? 'text-destructive' : 'text-muted-foreground')} />
              Paiements en retard
              {overduePayments.length > 0 && (
                <Badge variant="destructive" className="ml-auto animate-pulse">
                  {overduePayments.length}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>Nécessitent un suivi immédiat</CardDescription>
          </CardHeader>
          <CardContent>
            {overduePayments.length === 0 ? (
              <p className="text-muted-foreground text-sm italic">Aucun paiement en retard ✓</p>
            ) : (
              <div className="space-y-2">
                {overduePayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between border-b pb-2 text-sm last:border-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        {payment.subscription?.client?.name ?? 'Client inconnu'}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        Dû le {formatDate(payment.dueDate)}
                      </p>
                    </div>
                    <p className="text-destructive ml-2 shrink-0 font-semibold tabular-nums">
                      {formatCurrency(Number(payment.amount), payment.currencyCode)}
                    </p>
                  </div>
                ))}
                <Button asChild variant="ghost" size="sm" className="mt-1 w-full cursor-pointer">
                  <Link href={ROUTES.console.payments}>
                    Gérer les paiements <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent activity */}
      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="text-base">Activité récente</CardTitle>
          <CardDescription>Derniers abonnements créés</CardDescription>
        </CardHeader>
        <CardContent>
          {recentSubscriptions.length === 0 ? (
            <p className="text-muted-foreground text-sm italic">Aucune activité récente</p>
          ) : (
            <div className="space-y-1">
              {recentSubscriptions.map((sub) => {
                const statusCls = subscriptionStatusColor[sub.status] ?? subscriptionStatusColor.expired;
                const statusLbl = subscriptionStatusLabel[sub.status] ?? sub.status;
                return (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between border-b py-2 text-sm last:border-0"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <Badge className={cn('shrink-0 border text-xs', statusCls)}>
                        {statusLbl}
                      </Badge>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{getClientName(sub.clientId)}</p>
                        <p className="text-muted-foreground text-xs">
                          Créé le {formatDate(sub.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
