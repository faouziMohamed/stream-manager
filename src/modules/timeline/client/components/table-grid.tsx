'use client';

import { Badge } from '@/components/ui/badge';
import type { TimelineSubscription } from '@/lib/db/repositories/timeline.repository';

interface Props {
  subscriptions: TimelineSubscription[];
  fromDate: string;
  toDate: string;
}

const statusVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  active: 'default',
  expired: 'secondary',
  paused: 'outline',
  cancelled: 'destructive',
};

const statusLabels: Record<string, string> = {
  active: 'Actif',
  expired: 'Expiré',
  paused: 'Suspendu',
  cancelled: 'Annulé',
};

function getMonthsInRange(from: string, to: string) {
  const months: string[] = [];
  const start = new Date(from);
  const end = new Date(to);
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  while (cursor <= end) {
    months.push(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`);
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return months;
}

function overlapsMonth(sub: TimelineSubscription, month: string) {
  const monthStart = `${month}-01`;
  const [y, m] = month.split('-').map(Number);
  const monthEnd = new Date(y, m, 0).toISOString().slice(0, 10);
  return sub.startDate <= monthEnd && sub.endDate >= monthStart;
}

export function TableGrid({ subscriptions, fromDate, toDate }: Props) {
  const months = getMonthsInRange(fromDate, toDate);
  const clientNames = [...new Set(subscriptions.map((s) => s.clientName))].toSorted();

  if (subscriptions.length === 0) {
    return (
      <p className="text-muted-foreground py-12 text-center">Aucun abonnement sur cette période.</p>
    );
  }

  return (
    <div className="card-hover overflow-x-auto rounded-lg border">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-muted/30 border-b">
            <th className="text-muted-foreground bg-muted/30 sticky left-0 w-36 border-r px-3 py-2 text-left font-semibold">
              Client
            </th>
            {months.map((mo) => {
              const [y, m] = mo.split('-');
              const label = new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('fr-FR', {
                month: 'short',
                year: '2-digit',
              });
              return (
                <th
                  key={mo}
                  className="text-muted-foreground min-w-[80px] border-r px-2 py-2 text-center font-medium last:border-r-0"
                >
                  {label}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {clientNames.map((clientName) => (
            <tr key={clientName} className="hover:bg-muted/20 border-b last:border-b-0">
              <td className="bg-background sticky left-0 max-w-[140px] truncate border-r px-3 py-2 font-medium">
                {clientName}
              </td>
              {months.map((month) => {
                const activeSubs = subscriptions.filter(
                  (s) => s.clientName === clientName && overlapsMonth(s, month)
                );
                return (
                  <td key={month} className="border-r px-1 py-1 text-center last:border-r-0">
                    {activeSubs.length === 0 ? (
                      <span className="text-muted-foreground/30">—</span>
                    ) : (
                      <div className="flex flex-col items-center gap-0.5">
                        {activeSubs.map((s) => (
                          <Badge
                            key={s.id}
                            variant={statusVariants[s.status] ?? 'secondary'}
                            className="max-w-[72px] truncate px-1 py-0 text-[9px] leading-tight"
                            title={`${s.serviceName} · ${statusLabels[s.status]}`}
                          >
                            {s.serviceName.replace('[Promo] ', '').slice(0, 10)}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Legend */}
      <div className="bg-muted/20 flex flex-wrap gap-4 border-t px-4 py-2">
        {Object.entries(statusLabels).map(([key, label]) => (
          <div key={key} className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <Badge
              variant={statusVariants[key] ?? 'secondary'}
              className="h-2.5 w-2.5 rounded-sm p-0"
            />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
