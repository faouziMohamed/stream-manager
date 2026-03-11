'use client';

import {Users, Monitor, CreditCard, AlertCircle, Clock, TrendingUp} from 'lucide-react';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {useDashboardStats} from '@/lib/hooks/queries/use-analytics.queries';
import type {DashboardStatsDto} from '@/lib/graphql/operations/analytics.operations';

interface Props {
    initialData?: DashboardStatsDto;
}

export function DashboardStats({initialData}: Props) {
    const {data: stats} = useDashboardStats(initialData);

    const fmt = (n: number) =>
        `${n.toLocaleString('fr-MA', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        })} ${stats?.currencyCode ?? 'MAD'}`;

    const cards = [
        {
            title: 'Abonnements actifs',
            value: String(stats?.activeSubscriptions ?? '—'),
            icon: Monitor,
            color: 'text-primary'
        },
        {title: 'Total clients', value: String(stats?.totalClients ?? '—'), icon: Users, color: 'text-blue-500'},
        {title: 'MRR', value: stats ? fmt(stats.mrr) : '—', icon: TrendingUp, color: 'text-green-500'},
        {title: 'En retard', value: String(stats?.overdueCount ?? '—'), icon: AlertCircle, color: 'text-destructive'},
        {title: 'Échéances (7j)', value: String(stats?.upcomingDueCount ?? '—'), icon: Clock, color: 'text-orange-500'},
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Tableau de bord</h1>
                <p className="text-muted-foreground text-sm">Vue d&apos;ensemble de votre activité</p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
                {cards.map(({title, value, icon: Icon, color}) => (
                    <Card key={title}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                            <Icon className={`h-4 w-4 ${color}`}/>
                        </CardHeader>
                        <CardContent>
                            <p className={`text-2xl font-bold ${title === 'En retard' && (stats?.overdueCount ?? 0) > 0 ? 'text-destructive' : ''}`}>
                                {value}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
