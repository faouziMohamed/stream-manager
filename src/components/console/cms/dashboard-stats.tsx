"use client";

import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  Clock,
  CreditCard,
  Monitor,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDashboardStats } from "@/lib/hooks/queries/use-analytics.queries";
import { useSubscriptions } from "@/lib/hooks/queries/use-subscriptions.queries";
import { usePayments } from "@/lib/hooks/queries/use-payments.queries";
import { useClients } from "@/lib/hooks/queries/use-clients.queries";
import type { DashboardStatsDto } from "@/lib/graphql/operations/analytics.operations";
import { formatCurrency } from "@/lib/utils/helpers";
import { ROUTES } from "@/lib/config/routes";

interface Props {
  initialData?: DashboardStatsDto;
}

export function DashboardStats({ initialData }: Props) {
  const { data: stats } = useDashboardStats(initialData);
  const { data: subscriptions = [] } = useSubscriptions();
  const { data: payments = [] } = usePayments();
  const { data: clients = [] } = useClients();

  const cards = [
    {
      title: "Abonnements actifs",
      value: String(stats?.activeSubscriptions ?? "—"),
      icon: Monitor,
      color: "text-primary",
    },
    {
      title: "Total clients",
      value: String(stats?.totalClients ?? "—"),
      icon: Users,
      color: "text-blue-500",
    },
    {
      title: "MRR",
      value: stats
        ? formatCurrency(stats.mrr, stats.currencyCode ?? "MAD")
        : "—",
      icon: TrendingUp,
      color: "text-green-500",
    },
    {
      title: "En retard",
      value: String(stats?.overdueCount ?? "—"),
      icon: AlertCircle,
      color: "text-destructive",
    },
    {
      title: "Échéances (7j)",
      value: String(stats?.upcomingDueCount ?? "—"),
      icon: Clock,
      color: "text-orange-500",
    },
  ];

  // Upcoming renewals (expiring in next 30 days)
  const today = new Date();
  const in30Days = new Date(today);
  in30Days.setDate(today.getDate() + 30);

  const upcomingRenewals = subscriptions
    .filter((s) => s.status === "active" && s.endDate)
    .filter((s) => {
      const end = new Date(s.endDate);
      return end >= today && end <= in30Days;
    })
    .sort(
      (a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime(),
    )
    .slice(0, 5);

  // Overdue payments with client info
  const overduePayments = payments
    .filter((p) => p.status === "overdue")
    .sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
    )
    .slice(0, 5);

  // Recent subscriptions (last 5)
  const recentSubscriptions = [...subscriptions]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 5);

  const getClientName = (clientId: string) =>
    clients.find((c) => c.id === clientId)?.name ?? "Client inconnu";

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getDaysUntil = (date: string | Date) => {
    const diff = new Date(date).getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tableau de bord</h1>
        <p className="text-muted-foreground text-sm">
          Vue d&apos;ensemble de votre activité
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map(({ title, value, icon: Icon, color }) => (
          <Card key={title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${color}`} />
            </CardHeader>
            <CardContent>
              <p
                className={`text-2xl font-bold ${title === "En retard" && (stats?.overdueCount ?? 0) > 0 ? "text-destructive" : ""}`}
              >
                {value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Actions rapides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="cursor-pointer"
            >
              <Link href={ROUTES.console.subscriptions}>
                <Calendar className="h-3.5 w-3.5 mr-1.5" />
                Nouvel abonnement
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="cursor-pointer"
            >
              <Link href={ROUTES.console.clients}>
                <Users className="h-3.5 w-3.5 mr-1.5" />
                Nouveau client
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="cursor-pointer"
            >
              <Link href={ROUTES.console.payments}>
                <CreditCard className="h-3.5 w-3.5 mr-1.5" />
                Gérer les paiements
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="cursor-pointer"
            >
              <Link href={ROUTES.console.analytics}>
                <TrendingUp className="h-3.5 w-3.5 mr-1.5" />
                Voir les analytiques
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming renewals */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-500" />
              Renouvellements à venir
            </CardTitle>
            <CardDescription>
              Expirent dans les 30 prochains jours
            </CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingRenewals.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                Aucun renouvellement imminent
              </p>
            ) : (
              <div className="space-y-3">
                {upcomingRenewals.map((sub) => {
                  const daysLeft = getDaysUntil(sub.endDate);
                  return (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between text-sm border-b pb-2 last:border-0"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">
                          {getClientName(sub.clientId)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Expire le {formatDate(sub.endDate)}
                        </p>
                      </div>
                      <Badge
                        variant={daysLeft <= 7 ? "destructive" : "secondary"}
                        className="ml-2 shrink-0"
                      >
                        {daysLeft}j
                      </Badge>
                    </div>
                  );
                })}
                {upcomingRenewals.length > 0 && (
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="w-full mt-2 cursor-pointer"
                  >
                    <Link href={ROUTES.console.subscriptions}>
                      Voir tout <ArrowRight className="h-3.5 w-3.5 ml-1" />
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Overdue payments */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              Paiements en retard
            </CardTitle>
            <CardDescription>Nécessitent un suivi immédiat</CardDescription>
          </CardHeader>
          <CardContent>
            {overduePayments.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                Aucun paiement en retard
              </p>
            ) : (
              <div className="space-y-3">
                {overduePayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between text-sm border-b pb-2 last:border-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">
                        {payment.subscription?.client?.name ?? "Client inconnu"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Dû le {formatDate(payment.dueDate)}
                      </p>
                    </div>
                    <p className="font-semibold text-destructive ml-2 shrink-0 tabular-nums">
                      {formatCurrency(
                        Number(payment.amount),
                        payment.currencyCode,
                      )}
                    </p>
                  </div>
                ))}
                {overduePayments.length > 0 && (
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="w-full mt-2 cursor-pointer"
                  >
                    <Link href={ROUTES.console.payments}>
                      Gérer les paiements{" "}
                      <ArrowRight className="h-3.5 w-3.5 ml-1" />
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Activité récente</CardTitle>
          <CardDescription>Derniers abonnements créés</CardDescription>
        </CardHeader>
        <CardContent>
          {recentSubscriptions.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              Aucune activité récente
            </p>
          ) : (
            <div className="space-y-2">
              {recentSubscriptions.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between text-sm py-2 border-b last:border-0"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Badge
                      variant={
                        sub.status === "active" ? "default" : "secondary"
                      }
                      className="shrink-0"
                    >
                      {sub.status}
                    </Badge>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">
                        {getClientName(sub.clientId)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Créé le {formatDate(sub.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
