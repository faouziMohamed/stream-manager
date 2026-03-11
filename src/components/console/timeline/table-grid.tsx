"use client";

import { Badge } from "@/components/ui/badge";
import type { TimelineSubscription } from "@/lib/db/repositories/timeline.repository";

interface Props {
  subscriptions: TimelineSubscription[];
  fromDate: string;
  toDate: string;
}

const statusVariants: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  active: "default",
  expired: "secondary",
  paused: "outline",
  cancelled: "destructive",
};

const statusLabels: Record<string, string> = {
  active: "Actif",
  expired: "Expiré",
  paused: "Suspendu",
  cancelled: "Annulé",
};

function getMonthsInRange(from: string, to: string) {
  const months: string[] = [];
  const start = new Date(from);
  const end = new Date(to);
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  while (cursor <= end) {
    months.push(
      `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`,
    );
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return months;
}

function overlapsMonth(sub: TimelineSubscription, month: string) {
  const monthStart = `${month}-01`;
  const [y, m] = month.split("-").map(Number);
  const monthEnd = new Date(y, m, 0).toISOString().slice(0, 10);
  return sub.startDate <= monthEnd && sub.endDate >= monthStart;
}

export function TableGrid({ subscriptions, fromDate, toDate }: Props) {
  const months = getMonthsInRange(fromDate, toDate);
  const clientNames = [
    ...new Set(subscriptions.map((s) => s.clientName)),
  ].sort();

  if (subscriptions.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-12">
        Aucun abonnement sur cette période.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto border rounded-lg">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b bg-muted/30">
            <th className="text-left px-3 py-2 font-semibold text-muted-foreground border-r w-36 sticky left-0 bg-muted/30">
              Client
            </th>
            {months.map((mo) => {
              const [y, m] = mo.split("-");
              const label = new Date(
                Number(y),
                Number(m) - 1,
                1,
              ).toLocaleDateString("fr-FR", {
                month: "short",
                year: "2-digit",
              });
              return (
                <th
                  key={mo}
                  className="text-center px-2 py-2 font-medium text-muted-foreground border-r last:border-r-0 min-w-[80px]"
                >
                  {label}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {clientNames.map((clientName) => (
            <tr
              key={clientName}
              className="border-b last:border-b-0 hover:bg-muted/20"
            >
              <td className="px-3 py-2 font-medium border-r sticky left-0 bg-background truncate max-w-[140px]">
                {clientName}
              </td>
              {months.map((month) => {
                const activeSubs = subscriptions.filter(
                  (s) => s.clientName === clientName && overlapsMonth(s, month),
                );
                return (
                  <td
                    key={month}
                    className="px-1 py-1 border-r last:border-r-0 text-center"
                  >
                    {activeSubs.length === 0 ? (
                      <span className="text-muted-foreground/30">—</span>
                    ) : (
                      <div className="flex flex-col gap-0.5 items-center">
                        {activeSubs.map((s) => (
                          <Badge
                            key={s.id}
                            variant={statusVariants[s.status] ?? "secondary"}
                            className="text-[9px] px-1 py-0 leading-tight truncate max-w-[72px]"
                            title={`${s.serviceName} · ${statusLabels[s.status]}`}
                          >
                            {s.serviceName.replace("[Promo] ", "").slice(0, 10)}
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
      <div className="flex gap-4 px-4 py-2 border-t bg-muted/20 flex-wrap">
        {Object.entries(statusLabels).map(([key, label]) => (
          <div
            key={key}
            className="flex items-center gap-1.5 text-xs text-muted-foreground"
          >
            <Badge
              variant={statusVariants[key] ?? "secondary"}
              className="h-2.5 w-2.5 p-0 rounded-sm"
            />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
