'use client';

import Link from 'next/link';
import type { ElementType } from 'react';
import { AlertCircle, Calendar, Clock, CreditCard, Monitor, TrendingUp, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn, formatCurrency } from '@/lib/utils/helpers';
import type { DashboardStatsDto } from '@/lib/graphql/operations/analytics.operations';
import { ROUTES } from '@/lib/config/routes';

interface StatCardsProps {
  stats?: DashboardStatsDto;
}

interface StatCardDef {
  title: string;
  value: string;
  icon: ElementType;
  iconBg: string;
  iconColor: string;
  urgent?: boolean;
  tooltip?: string;
}

export function StatCards({ stats }: StatCardsProps) {
  const overdueCount = stats?.overdueCount ?? 0;
  const cards: StatCardDef[] = [
    {
      title: 'Abonnements actifs',
      value: String(stats?.activeSubscriptions ?? '—'),
      icon: Monitor,
      iconBg: 'bg-violet-100 dark:bg-violet-900/30',
      iconColor: 'text-violet-600 dark:text-violet-400',
    },
    {
      title: 'Total clients',
      value: String(stats?.totalClients ?? '—'),
      icon: Users,
      iconBg: 'bg-blue-100 dark:bg-blue-900/30',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      title: 'MRR',
      value: stats ? formatCurrency(stats.mrr, stats.currencyCode ?? 'MAD') : '—',
      icon: TrendingUp,
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      tooltip: 'Revenus mensuels récurrents (Monthly Recurring Revenue)',
    },
    {
      title: 'En retard',
      value: String(stats?.overdueCount ?? '—'),
      icon: AlertCircle,
      iconBg: overdueCount > 0 ? 'bg-red-100 dark:bg-red-900/30' : 'bg-slate-100 dark:bg-slate-800/40',
      iconColor: overdueCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-500',
      urgent: overdueCount > 0,
    },
    {
      title: 'Échéances (7j)',
      value: String(stats?.upcomingDueCount ?? '—'),
      icon: Clock,
      iconBg: 'bg-amber-100 dark:bg-amber-900/30',
      iconColor: 'text-amber-600 dark:text-amber-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {cards.map(({ title, value, icon: Icon, iconBg, iconColor, urgent, tooltip }) => (
        <Card
          key={title}
          className={cn(
            'card-hover relative overflow-hidden transition-shadow',
            urgent && 'ring-destructive/40 ring-2'
          )}
        >
          {urgent && (
            <div className="bg-destructive/5 absolute inset-0 animate-pulse rounded-xl" />
          )}
          <CardHeader className="relative flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              {tooltip ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="border-muted-foreground/30 cursor-help border-b border-dotted">
                      {title}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-60">
                    {tooltip}
                  </TooltipContent>
                </Tooltip>
              ) : (
                title
              )}
            </CardTitle>
            <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', iconBg)}>
              <Icon className={cn('h-4 w-4', iconColor)} />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <p
              className={cn(
                'text-2xl font-bold tabular-nums',
                urgent ? 'text-destructive' : ''
              )}
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
  const actions = [
    { href: ROUTES.console.subscriptions, icon: Calendar, label: 'Nouvel abonnement', color: 'hover:border-violet-400 hover:text-violet-600 dark:hover:text-violet-400' },
    { href: ROUTES.console.clients, icon: Users, label: 'Nouveau client', color: 'hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400' },
    { href: ROUTES.console.payments, icon: CreditCard, label: 'Paiements', color: 'hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400' },
    { href: ROUTES.console.analytics, icon: TrendingUp, label: 'Statistiques', color: 'hover:border-amber-400 hover:text-amber-600 dark:hover:text-amber-400' },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map(({ href, icon: Icon, label, color }) => (
        <Button
          key={href}
          asChild
          variant="outline"
          size="sm"
          className={cn('cursor-pointer gap-1.5 transition-colors', color)}
        >
          <Link href={href}>
            <Icon className="h-3.5 w-3.5" />
            {label}
          </Link>
        </Button>
      ))}
    </div>
  );
}
