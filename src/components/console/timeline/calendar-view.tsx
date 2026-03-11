"use client";

import { Badge } from "@/components/ui/badge";
import type { TimelineSubscription } from "@/lib/db/repositories/timeline.repository";

interface Props {
  subscriptions: TimelineSubscription[];
  year: number;
  month: number; // 1-based
}

const statusColors: Record<string, string> = {
  active: "bg-primary/90",
  expired: "bg-muted-foreground/40",
  paused: "bg-orange-400/80",
  cancelled: "bg-destructive/60",
};

const statusLabels: Record<string, string> = {
  active: "Actif",
  expired: "Expiré",
  paused: "Suspendu",
  cancelled: "Annulé",
};

const DAY_NAMES = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

// Returns 0 = Monday … 6 = Sunday
function firstWeekdayOfMonth(year: number, month: number) {
  const d = new Date(year, month - 1, 1).getDay();
  return d === 0 ? 6 : d - 1;
}

export function CalendarView({ subscriptions, year, month }: Props) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = firstWeekdayOfMonth(year, month);

  const cells: (number | null)[] = [
    ...Array<null>(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  // Pad to complete last week
  while (cells.length % 7 !== 0) cells.push(null);

  const monthStr = `${year}-${String(month).padStart(2, "0")}`;

  const subsForDay = (day: number) => {
    const dateStr = `${monthStr}-${String(day).padStart(2, "0")}`;
    return subscriptions.filter(
      (s) => s.startDate <= dateStr && s.endDate >= dateStr,
    );
  };

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="grid grid-cols-7 gap-px">
        {DAY_NAMES.map((d) => (
          <div
            key={d}
            className="text-center text-xs font-semibold text-muted-foreground py-2"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden border">
        {cells.map((day, idx) => {
          if (!day) {
            return <div key={idx} className="bg-muted/20 min-h-[80px]" />;
          }
          const daySubs = subsForDay(day);
          const today = new Date();
          const isToday =
            today.getFullYear() === year &&
            today.getMonth() + 1 === month &&
            today.getDate() === day;

          return (
            <div
              key={idx}
              className={`bg-background min-h-[80px] p-1 ${isToday ? "ring-1 ring-inset ring-primary" : ""}`}
            >
              <span
                className={`text-xs font-medium block mb-1 ${isToday ? "text-primary font-bold" : "text-muted-foreground"}`}
              >
                {day}
              </span>
              <div className="space-y-0.5">
                {daySubs.slice(0, 3).map((sub) => (
                  <div
                    key={sub.id}
                    className={`${statusColors[sub.status] ?? statusColors.active} text-white text-[9px] rounded px-1 py-px truncate cursor-default`}
                    title={`${sub.clientName} · ${sub.serviceName} · ${statusLabels[sub.status]}`}
                  >
                    {sub.clientName}
                  </div>
                ))}
                {daySubs.length > 3 && (
                  <span className="text-[9px] text-muted-foreground">
                    +{daySubs.length - 3} autres
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-4 pt-1 flex-wrap">
        {Object.entries(statusLabels).map(([key, label]) => (
          <div
            key={key}
            className="flex items-center gap-1.5 text-xs text-muted-foreground"
          >
            <span className={`h-2.5 w-2.5 rounded-sm ${statusColors[key]}`} />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
