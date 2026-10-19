'use client';

import { CalendarDays, ListOrdered, Table2 } from 'lucide-react';

import { Tabs, TabsList, TabsPanel, TabsTrigger } from '@/components/ui/tabs';
import { useUrlTab } from '@/lib/hooks/use-url-tab';
import { PaymentsAgenda } from '@/features/payments/ui/components/payments-agenda';
import { PaymentsCalendar } from '@/features/payments/ui/components/payments-calendar';
import { PaymentsConsole } from '@/features/payments/ui/components/payments-console';
import type { PaymentsPagePayload } from '@/features/payments/server/loaders/payments.loader';
import type { PaymentsListPayload } from '@/features/payments/ui/queries/use-payments.queries';

/**
 * The three ways an operator reads the same payments: a month at a glance, the
 * events in sequence, and the full ledger with its actions.
 *
 * They are tabs rather than stacked sections because each answers a different
 * question, and showing all three at once made the page a scroll with no
 * starting point.
 */
const VIEWS = ['calendar', 'agenda', 'ledger'] as const;

export function PaymentsWorkspace({ canManage, initialData, initialPage }: PaymentsWorkspaceProps) {
  const [view, setView] = useUrlTab('view', VIEWS, 'calendar');

  return (
    <Tabs className="mt-6" onValueChange={(next) => setView(String(next))} value={view}>
      <TabsList>
        <TabsTrigger value="calendar">
          <CalendarDays className="size-4" />
          Calendar
        </TabsTrigger>
        <TabsTrigger className="hidden sm:inline-flex" value="agenda">
          <ListOrdered className="size-4" />
          Agenda
        </TabsTrigger>
        <TabsTrigger value="ledger">
          <Table2 className="size-4" />
          Ledger
        </TabsTrigger>
      </TabsList>

      <TabsPanel value="calendar">
        <PaymentsCalendar
          customers={initialData.customerOptions}
          memberships={initialData.membershipOptions}
          mode="calendar"
          payments={initialData.items}
        />
      </TabsPanel>

      <TabsPanel value="agenda">
        <PaymentsAgenda
          canManage={canManage}
          customerOptions={initialData.customerOptions}
          initialPage={initialPage}
          membershipOptions={initialData.membershipOptions}
        />
      </TabsPanel>

      <TabsPanel value="ledger">
        <PaymentsConsole
          canManage={canManage}
          customerOptions={initialData.customerOptions}
          initialPage={initialPage}
          membershipOptions={initialData.membershipOptions}
        />
      </TabsPanel>
    </Tabs>
  );
}

type PaymentsWorkspaceProps = {
  /** Record and mark-paid are admin mutations. */
  canManage: boolean;
  /** The whole set, for the calendar and the trend chart. */
  initialData: PaymentsListPayload;
  /** The first page of the ledger and agenda, which then page on the server. */
  initialPage: PaymentsPagePayload;
};
