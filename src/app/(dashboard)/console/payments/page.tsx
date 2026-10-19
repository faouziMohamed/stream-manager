import { ConsolePageHeader } from '@/components/console/shared/console-page-header';
import { ConsoleRefreshButton } from '@/components/console/shared/console-refresh-button';
import { loadPayments, loadPaymentsPage } from '@/features/payments/server/loaders/payments.loader';
import { PAYMENTS_QUERY_KEY } from '@/features/payments/ui/queries/use-payments.queries';
import { PaymentTrendChart } from '@/features/payments/ui/components/payment-trend-chart';
import { PaymentsWorkspace } from '@/features/payments/ui/components/payments-workspace';
import { isCurrentUserAdmin } from '@/lib/auth/current-user';
import { DEFAULT_CURRENCY } from '@/lib/utils/currency';

export default async function PaymentsPage() {
  const canManage = await isCurrentUserAdmin();
  const {
    cancelledCount,
    customerOptions,
    items,
    membershipOptions,
    overdueCount,
    paidCount,
    total,
    unpaidCount,
  } = await loadPayments();
  // The ledger and the agenda page on the server; the calendar and the trend
  // chart still need the whole history, which is why both loads exist.
  const initialPage = await loadPaymentsPage({ order: 'desc', page: 1, pageSize: 20 });

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <ConsolePageHeader
        title="Payments"
        description="Monitor collections, overdue exposure, and every action across the payment lifecycle."
        actions={
          <ConsoleRefreshButton ariaLabel="Refresh payments" queryKey={PAYMENTS_QUERY_KEY} />
        }
      />

      <PaymentTrendChart
        currencyCode={items[0]?.currencyCode ?? DEFAULT_CURRENCY}
        payments={items}
      />

      <PaymentsWorkspace
        canManage={canManage}
        initialPage={initialPage}
        initialData={{
          cancelledCount,
          customerOptions,
          items,
          membershipOptions,
          overdueCount,
          paidCount,
          total,
          unpaidCount,
        }}
      />
    </main>
  );
}
