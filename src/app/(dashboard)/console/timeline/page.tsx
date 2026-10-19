import { ConsolePageHeader } from '@/components/console/shared/console-page-header';
import { loadTimeline } from '@/features/timeline/server/loaders/timeline.loader';
import type { ViewMode } from '@/features/timeline/ui/components/timeline-console.helpers';
import { TimelineConsole } from '@/features/timeline/ui/components/timeline-console';

export default async function TimelinePage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const [items, params] = await Promise.all([loadTimeline(), searchParams]);
  const rawView = params.view;
  const initialView: ViewMode = rawView === 'calendar' ? 'calendar' : 'gantt';

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <ConsolePageHeader
        title="Timeline"
        description="Coverage in force over time: every subscription window, by customer, on one axis."
      />
      <TimelineConsole initialData={{ items }} initialView={initialView} />
    </main>
  );
}
