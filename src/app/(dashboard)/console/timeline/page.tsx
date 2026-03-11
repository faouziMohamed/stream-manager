import { Suspense } from "react";
import { getTimelineSubscriptions } from "@/lib/db/repositories/timeline.repository";
import { TimelineDashboard } from "@/components/console/timeline/timeline-dashboard";

export default async function TimelinePage() {
  // Default: current month → +3 months
  const today = new Date();
  const fromDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
  const endDate = new Date(today.getFullYear(), today.getMonth() + 4, 0);
  const toDate = endDate.toISOString().slice(0, 10);

  const subscriptions = await getTimelineSubscriptions(fromDate, toDate);

  return (
    <Suspense>
      <TimelineDashboard
        subscriptions={subscriptions}
        initialFromDate={fromDate}
        initialToDate={toDate}
      />
    </Suspense>
  );
}
