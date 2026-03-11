"use client";

import type { TimelineSubscription } from "@/lib/db/repositories/timeline.repository";

interface Props {
  subscriptions: TimelineSubscription[];
  fromDate: string;
  toDate: string;
}

const statusColors: Record<string, string> = {
  active: "bg-primary",
  expired: "bg-muted-foreground/40",
  paused: "bg-orange-400",
  cancelled: "bg-destructive/60",
};

const statusLabels: Record<string, string> = {
  active: "Actif",
  expired: "Expiré",
  paused: "Suspendu",
  cancelled: "Annulé",
};

function getDaysInRange(from: string, to: string) {
  const start = new Date(from);
  const end = new Date(to);
  return Math.ceil((end.getTime() - start.getTime()) / 86_400_000) + 1;
}

function clamp(date: string, from: string, to: string) {
  if (date < from) return from;
  if (date > to) return to;
  return date;
}

function dayOffset(date: string, from: string) {
  return Math.floor(
    (new Date(date).getTime() - new Date(from).getTime()) / 86_400_000,
  );
}

export function GanttChart({ subscriptions, fromDate, toDate }: Props) {
  const totalDays = getDaysInRange(fromDate, toDate);

  // Group by serviceName for Y-axis rows
  const serviceMap = new Map<string, TimelineSubscription[]>();
  for (const sub of subscriptions) {
    const existing = serviceMap.get(sub.serviceName) ?? [];
    serviceMap.set(sub.serviceName, [...existing, sub]);
  }

  // Build month headers
  const months: { label: string; days: number }[] = [];
  let cursor = new Date(fromDate);
  const end = new Date(toDate);
  while (cursor <= end) {
    const y = cursor.getFullYear();
    const m = cursor.getMonth();
    const monthEnd = new Date(y, m + 1, 0);
    const visibleEnd = monthEnd < end ? monthEnd : end;
    const days =
      Math.floor((visibleEnd.getTime() - cursor.getTime()) / 86_400_000) + 1;
    months.push({
      label: cursor.toLocaleDateString("fr-FR", {
        month: "short",
        year: "2-digit",
      }),
      days,
    });
    cursor = new Date(y, m + 1, 1);
  }

  if (serviceMap.size === 0) {
    return (
      <p className="text-center text-muted-foreground py-12">
        Aucun abonnement sur cette période.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto border rounded-lg">
      <div style={{ minWidth: Math.max(totalDays * 4 + 200, 600) }}>
        {/* Month header */}
        <div className="flex border-b bg-muted/30">
          <div className="w-48 shrink-0 px-3 py-2 text-xs font-semibold text-muted-foreground border-r">
            Service / Client
          </div>
          <div className="flex flex-1">
            {months.map((mo, i) => (
              <div
                key={i}
                className="text-xs font-medium text-muted-foreground px-2 py-2 border-r last:border-r-0 truncate"
                style={{ width: `${(mo.days / totalDays) * 100}%` }}
              >
                {mo.label}
              </div>
            ))}
          </div>
        </div>

        {/* Rows */}
        {Array.from(serviceMap.entries()).map(([serviceName, subs]) => (
          <div
            key={serviceName}
            className="flex border-b last:border-b-0 group hover:bg-muted/20"
          >
            <div className="w-48 shrink-0 px-3 py-3 text-xs font-semibold border-r truncate self-center">
              {serviceName}
            </div>
            <div
              className="flex-1 relative"
              style={{ height: Math.max(subs.length * 28 + 8, 40) }}
            >
              {subs.map((sub, idx) => {
                const cStart = clamp(sub.startDate, fromDate, toDate);
                const cEnd = clamp(sub.endDate, fromDate, toDate);
                const left = (dayOffset(cStart, fromDate) / totalDays) * 100;
                const width = Math.max(
                  ((dayOffset(cEnd, fromDate) -
                    dayOffset(cStart, fromDate) +
                    1) /
                    totalDays) *
                    100,
                  0.5,
                );
                const color = statusColors[sub.status] ?? statusColors.active;
                return (
                  <div
                    key={sub.id}
                    className={`absolute ${color} text-white text-[10px] rounded px-1.5 flex items-center overflow-hidden cursor-default`}
                    style={{
                      left: `${left}%`,
                      width: `${width}%`,
                      top: idx * 28 + 4,
                      height: 22,
                    }}
                    title={`${sub.clientName} · ${sub.planName} · ${sub.startDate} → ${sub.endDate} · ${statusLabels[sub.status]}`}
                  >
                    <span className="truncate">{sub.clientName}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex gap-4 px-4 py-2 border-t bg-muted/20 flex-wrap">
        {Object.entries(statusLabels).map(([key, label]) => (
          <div
            key={key}
            className="flex items-center gap-1.5 text-xs text-muted-foreground"
          >
            <span className={`h-3 w-3 rounded-sm ${statusColors[key]}`} />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
