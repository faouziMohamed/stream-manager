"use client";

import Link from "next/link";
import {
  AlertCircle,
  Calendar,
  Clock,
  CreditCard,
  Monitor,
  TrendingUp,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { DashboardStatsDto } from "@/lib/graphql/operations/analytics.operations";
import { formatCurrency } from "@/lib/utils/helpers";
import { ROUTES } from "@/lib/config/routes";

interface StatCardsProps {
  stats?: DashboardStatsDto;
}

export function StatCards({ stats }: StatCardsProps) {
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

  return (
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
  );
}

export function QuickActions() {
  return (
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
  );
}
