'use client';

import {useState} from 'react';
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
import {Button} from '@/components/ui/button';
import {useAnalytics} from '@/lib/hooks/queries/use-analytics.queries';
import type {AnalyticsDto} from '@/lib/graphql/operations/analytics.operations';
import {formatCurrency} from '@/lib/utils/helpers';

interface Props {
    initialData?: AnalyticsDto;
}

const PERIOD_OPTIONS = [
    {label: '3 mois', value: 3},
    {label: '6 mois', value: 6},
    {label: '12 mois', value: 12},
];

// Format month "2025-03" → "Mars 25"
function formatMonth(m: string) {
    const [year, month] = m.split('-');
    const date = new Date(Number(year), Number(month) - 1, 1);
    return date.toLocaleDateString('fr-FR', {month: 'short', year: '2-digit'});
}

export function AnalyticsDashboard({initialData}: Props) {
    const [months, setMonths] = useState(6);
    const {data} = useAnalytics(months, months === 6 ? initialData : undefined);

    const currency = data?.monthlyRevenue[0]?.currencyCode ?? 'MAD';

    const revenueData = (data?.monthlyRevenue ?? []).map((d) => ({
        mois: formatMonth(d.month),
        Revenus: d.revenue,
    }));

    const breakdownData = (data?.paymentBreakdown ?? []).map((d) => ({
        mois: formatMonth(d.month),
        Payé: d.paid,
        'En attente': d.unpaid,
        'En retard': d.overdue,
    }));

    const serviceData = (data?.subscriptionsByService ?? []).map((d) => ({
        service: d.serviceName.replace('[Bundle] ', ''),
        Abonnements: d.count,
        Revenus: d.revenue,
    }));

    const totalRevenue = revenueData.reduce((s, d) => s + d.Revenus, 0);
    const totalUnpaid = (data?.paymentBreakdown ?? []).reduce((s, d) => s + d.unpaid, 0);
    const totalOverdue = (data?.paymentBreakdown ?? []).reduce((s, d) => s + d.overdue, 0);

    const fmt = (n: number) => formatCurrency(n, currency);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold">Analytiques</h1>
                    <p className="text-muted-foreground text-sm">Évolution des revenus et des paiements</p>
                </div>
                <div className="flex gap-2">
                    {PERIOD_OPTIONS.map((opt) => (
                        <Button
                            key={opt.value}
                            size="sm"
                            variant={months === opt.value ? 'default' : 'outline'}
                            onClick={() => setMonths(opt.value)}
                        >
                            {opt.label}
                        </Button>
                    ))}
                </div>
            </div>

            {/* KPI summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-1"><CardTitle className="text-sm text-muted-foreground">Revenus
                        encaissés</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-bold text-primary">{fmt(totalRevenue)}</p></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-1"><CardTitle className="text-sm text-muted-foreground">En
                        attente</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-bold">{fmt(totalUnpaid)}</p></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-1"><CardTitle className="text-sm text-muted-foreground">En
                        retard</CardTitle></CardHeader>
                    <CardContent><p
                        className={`text-2xl font-bold ${totalOverdue > 0 ? 'text-destructive' : ''}`}>{fmt(totalOverdue)}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Revenue line chart */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Évolution des revenus</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={260}>
                        <LineChart data={revenueData} margin={{top: 5, right: 20, left: 0, bottom: 5}}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-border"/>
                            <XAxis dataKey="mois" tick={{fontSize: 12}}/>
                            <YAxis tick={{fontSize: 12}} tickFormatter={(v: number) => String(v)}/>
                            <Tooltip formatter={(v: number) => [formatCurrency(v, currency), 'Revenus']}/>
                            <Line type="monotone" dataKey="Revenus" stroke="hsl(var(--primary))" strokeWidth={2}
                                  dot={{r: 3}} activeDot={{r: 5}}/>
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Payment breakdown stacked bar */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Répartition des paiements</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={breakdownData} margin={{top: 5, right: 20, left: 0, bottom: 5}}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-border"/>
                            <XAxis dataKey="mois" tick={{fontSize: 12}}/>
                            <YAxis tick={{fontSize: 12}}/>
                            <Tooltip formatter={(v: number, name: string) => [formatCurrency(v, currency), name]}/>
                            <Legend/>
                            <Bar dataKey="Payé" stackId="a" fill="hsl(var(--primary))" radius={[0, 0, 0, 0]}/>
                            <Bar dataKey="En attente" stackId="a" fill="hsl(var(--muted-foreground))" opacity={0.5}/>
                            <Bar dataKey="En retard" stackId="a" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]}/>
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Subscriptions by service */}
            {serviceData.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Abonnements actifs par service</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={Math.max(220, serviceData.length * 40)}>
                            <BarChart data={serviceData} layout="vertical"
                                      margin={{top: 5, right: 20, left: 100, bottom: 5}}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-border"/>
                                <XAxis type="number" tick={{fontSize: 12}}/>
                                <YAxis dataKey="service" type="category" tick={{fontSize: 11}} width={95}/>
                                <Tooltip/>
                                <Bar dataKey="Abonnements" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]}/>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
