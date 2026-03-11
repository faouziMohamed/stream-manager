'use client';

import {AlertCircle, Clock, Monitor, TrendingUp, Users} from 'lucide-react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Badge} from '@/components/ui/badge';
import type {AnalyticsDto, DashboardStatsDto} from '@/lib/graphql/operations/analytics.operations';

interface Props {
    stats: DashboardStatsDto;
    analytics: AnalyticsDto;
    showSensitiveInfo: boolean;
    label?: string | null;
}

function formatMonth(m: string) {
    const [year, month] = m.split('-');
    return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString('fr-FR', {
        month: 'short',
        year: '2-digit',
    });
}

export function SummaryView({stats, analytics, showSensitiveInfo, label}: Props) {
    const currency = stats.currencyCode;
    const fmt = (n: number) =>
        showSensitiveInfo
            ? `${n.toLocaleString('fr-MA', {maximumFractionDigits: 0})} ${currency}`
            : '••••';

    const revenueData = analytics.monthlyRevenue.map((d) => ({
        mois: formatMonth(d.month),
        Revenus: showSensitiveInfo ? d.revenue : 0,
    }));

    const breakdownData = analytics.paymentBreakdown.map((d) => ({
        mois: formatMonth(d.month),
        Payé: d.paid,
        'En attente': d.unpaid,
        'En retard': d.overdue,
    }));

    return (
        <div className="space-y-6 max-w-4xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="text-center space-y-1">
                <h1 className="text-2xl font-bold">Résumé des activités</h1>
                {label && <p className="text-muted-foreground text-sm">{label}</p>}
                <Badge variant="outline" className="text-xs">Lecture seule</Badge>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                    {
                        title: 'Abonnements actifs',
                        value: String(stats.activeSubscriptions),
                        icon: Monitor,
                        color: 'text-primary'
                    },
                    {
                        title: 'Clients',
                        value: showSensitiveInfo ? String(stats.totalClients) : '••',
                        icon: Users,
                        color: 'text-blue-500'
                    },
                    {title: 'MRR', value: fmt(stats.mrr), icon: TrendingUp, color: 'text-green-500'},
                    {
                        title: 'En retard',
                        value: String(stats.overdueCount),
                        icon: AlertCircle,
                        color: stats.overdueCount > 0 ? 'text-destructive' : 'text-muted-foreground'
                    },
                    {
                        title: 'Échéances (7j)',
                        value: String(stats.upcomingDueCount),
                        icon: Clock,
                        color: 'text-orange-500'
                    },
                ].map(({title, value, icon: Icon, color}) => (
                    <Card key={title}>
                        <CardHeader className="pb-1 pt-3 px-3 flex flex-row items-center justify-between">
                            <CardTitle className="text-xs text-muted-foreground">{title}</CardTitle>
                            <Icon className={`h-3.5 w-3.5 ${color}`}/>
                        </CardHeader>
                        <CardContent className="px-3 pb-3">
                            <p className="text-xl font-bold">{value}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Revenue chart */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm">
                        Évolution des revenus {!showSensitiveInfo &&
                      <span className="text-muted-foreground text-xs">(masqués)</span>}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={revenueData}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-border"/>
                            <XAxis dataKey="mois" tick={{fontSize: 11}}/>
                            <YAxis tick={{fontSize: 11}}/>
                            <Tooltip formatter={(v) => [`${v ?? 0} ${currency}`, 'Revenus']}/>
                            <Line type="monotone" dataKey="Revenus" stroke="hsl(var(--primary))" strokeWidth={2}
                                  dot={{r: 3}}/>
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Payment breakdown */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm">Répartition des paiements</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={breakdownData}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-border"/>
                            <XAxis dataKey="mois" tick={{fontSize: 11}}/>
                            <YAxis tick={{fontSize: 11}}/>
                            <Tooltip formatter={(v, name) => [`${v ?? 0} ${currency}`, name]}/>
                            <Legend/>
                            <Bar dataKey="Payé" stackId="a" fill="hsl(var(--primary))"/>
                            <Bar dataKey="En attente" stackId="a" fill="hsl(var(--muted-foreground))" opacity={0.5}/>
                            <Bar dataKey="En retard" stackId="a" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]}/>
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <p className="text-center text-xs text-muted-foreground pt-4">
                Ce résumé est en lecture seule — généré automatiquement.
            </p>
        </div>
    );
}
