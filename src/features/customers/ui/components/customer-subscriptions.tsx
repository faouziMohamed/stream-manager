'use client';

import {
  BadgeCheck,
  CalendarRange,
  CreditCard,
  Loader2,
  Plus,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';

import { ConfirmActionDialog } from '@/components/console/shared/confirm-action-dialog';
import { PendingPaymentsList } from '@/components/console/shared/pending-payments-list';
import { StatusBadge } from '@/components/console/shared/status-badge';
import type { StatusTone } from '@/components/console/shared/status-badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  formatMembershipPhase,
  getMembershipPhase,
  getMembershipPhaseTone,
} from '@/features/memberships/shared/membership-status';
import type {
  CustomerHub,
  CustomerSubscription,
  HubPayment,
} from '@/features/customers/shared/customer-hub.mapper';
import {
  useCancelSubscription,
  useCustomerHub,
  useMarkPaymentPaid,
  useRenewSubscription,
} from '@/features/customers/ui/queries/use-customer-hub.queries';
import { ROUTES } from '@/lib/config/routes';
import { cn } from '@/lib/utils';

type CustomerSubscriptionsProps = {
  /** Renew, cancel and mark-paid are admin mutations. */
  canManage: boolean;
  customerId: string;
  initialHub: CustomerHub;
};

function handle(mutation: MutationLike, id: string, success: string) {
  mutation.mutate(id, {
    onSuccess: () => toast.success(success),
    onError: (error: unknown) =>
      toast.error(error instanceof Error ? error.message : 'That action failed'),
  });
}

/**
 * The customer hub: every subscription this customer has, each with its own
 * payments and the actions an operator actually performs — renew or cancel a
 * subscription, settle a payment — without leaving the page.
 */
export function CustomerSubscriptions({
  canManage,
  customerId,
  initialHub,
}: CustomerSubscriptionsProps) {
  const { data: hub } = useCustomerHub(customerId, initialHub);
  const cancelMutation = useCancelSubscription(customerId);
  const renewMutation = useRenewSubscription(customerId);
  const markPaidMutation = useMarkPaymentPaid(customerId);
  const [confirmPaidPayment, setConfirmPaidPayment] = useState<HubPayment | null>(null);
  const [confirmSubscription, setConfirmSubscription] = useState<{
    action: 'cancel' | 'renew';
    subscription: CustomerSubscription;
  } | null>(null);

  return (
    <section className="mt-10 space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="sm-title text-lg font-semibold">Subscriptions</h2>
          <p className="sm-subtitle text-sm">
            {hub.subscriptions.length} total
            {hub.outstandingTotal === '0.00' ? null : ` · ${hub.outstandingTotal} outstanding`}
          </p>
        </div>
        {canManage ? (
          <Link
            className={cn(buttonVariants({ size: 'sm' }), 'gap-2')}
            href={ROUTES.console.newSubscription}
          >
            <Plus className="size-4" />
            New subscription
          </Link>
        ) : null}
      </header>

      {hub.subscriptions.length === 0 ? (
        <p className="rounded-lg border border-(--sm-border) p-6 text-center text-sm text-(--sm-muted)">
          No subscriptions yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {hub.subscriptions.map((subscription) => (
            <SubscriptionCard
              canManage={canManage}
              isCancelling={
                cancelMutation.isPending && cancelMutation.variables === subscription.id
              }
              isRenewing={renewMutation.isPending && renewMutation.variables === subscription.id}
              key={subscription.id}
              onCancel={() => setConfirmSubscription({ action: 'cancel', subscription })}
              onMarkPaid={(paymentId) =>
                setConfirmPaidPayment(
                  subscription.payments.find((payment) => payment.id === paymentId) ?? null
                )
              }
              pendingPaymentId={markPaidMutation.isPending ? markPaidMutation.variables : null}
              onRenew={() => setConfirmSubscription({ action: 'renew', subscription })}
              subscription={subscription}
            />
          ))}
        </ul>
      )}

      {hub.unlinkedPayments.length === 0 ? null : (
        <div className="rounded-lg border border-(--sm-gold-b) bg-(--sm-gold-s) p-4">
          <p className="text-sm font-medium text-(--sm-gold)">
            {hub.unlinkedPayments.length} payment(s) not linked to a listed subscription
          </p>
          <ul className="mt-2 space-y-1">
            {hub.unlinkedPayments.map((payment) => (
              <li className="text-xs text-(--sm-muted)" key={payment.id}>
                {payment.businessId} · {payment.amount} {payment.currencyCode} · {payment.status}
              </li>
            ))}
          </ul>
        </div>
      )}

      <AlertDialog
        open={confirmPaidPayment !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmPaidPayment(null);
        }}
      >
        <AlertDialogContent className="border border-(--sm-border) bg-(--sm-surface)">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-(--sm-emerald-s) text-(--sm-emerald-t)">
              <BadgeCheck className="size-5" />
            </AlertDialogMedia>
            <AlertDialogTitle>Mark this payment as paid?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmPaidPayment === null
                ? ''
                : `${confirmPaidPayment.businessId} · ${confirmPaidPayment.amount} ${confirmPaidPayment.currencyCode} will be recorded as settled today.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep unpaid</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmPaidPayment === null) return;
                handle(markPaidMutation, confirmPaidPayment.id, 'Payment marked paid');
                setConfirmPaidPayment(null);
              }}
            >
              Mark paid
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ConfirmActionDialog
        confirmLabel={confirmSubscription?.action === 'cancel' ? 'Cancel subscription' : 'Renew'}
        description={
          confirmSubscription?.action === 'cancel'
            ? `${confirmSubscription.subscription.planLabel} will be cancelled and its pending payments cancelled.`
            : `${confirmSubscription?.subscription.planLabel ?? 'This subscription'} will renew for another term and a new payment will be scheduled.`
        }
        details={
          confirmSubscription?.action === 'cancel' ? (
            <PendingPaymentsList
              payments={confirmSubscription.subscription.payments.filter(
                (payment) => payment.status === 'unpaid' || payment.status === 'overdue'
              )}
            />
          ) : undefined
        }
        icon={
          confirmSubscription?.action === 'cancel' ? (
            <XCircle className="size-5" />
          ) : (
            <RotateCcw className="size-5" />
          )
        }
        onConfirm={() => {
          if (confirmSubscription === null) return;
          const { action, subscription } = confirmSubscription;
          if (action === 'cancel') {
            handle(cancelMutation, subscription.id, 'Subscription cancelled');
          } else {
            handle(renewMutation, subscription.id, 'Subscription renewed');
          }
          setConfirmSubscription(null);
        }}
        onOpenChangeAction={(open) => {
          if (!open) setConfirmSubscription(null);
        }}
        open={confirmSubscription !== null}
        pending={
          confirmSubscription?.action === 'cancel'
            ? cancelMutation.isPending
            : renewMutation.isPending
        }
        title={
          confirmSubscription?.action === 'cancel'
            ? 'Cancel this subscription?'
            : 'Renew this subscription?'
        }
        tone={confirmSubscription?.action === 'cancel' ? 'destructive' : 'accent'}
      />
    </section>
  );
}

function SubscriptionCard({
  canManage,
  isCancelling,
  isRenewing,
  onCancel,
  onMarkPaid,
  onRenew,
  pendingPaymentId,
  subscription,
}: SubscriptionCardProps) {
  const isCancelled = subscription.status === 'cancelled';
  // Same rule as the ledger: the dates decide active/upcoming/expired, the
  // stored word only decides cancelled.
  const phase = getMembershipPhase(
    subscription.status,
    subscription.startDate,
    subscription.endDate,
    undefined,
    subscription.isRecurring
  );

  return (
    <li className="rounded-lg border border-(--sm-border) p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{subscription.planLabel}</span>
            <StatusBadge tone={getMembershipPhaseTone(phase)}>
              {formatMembershipPhase(phase)}
            </StatusBadge>
            {subscription.isRecurring ? <StatusBadge tone="neutral">recurring</StatusBadge> : null}
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-(--sm-muted)">
            <CalendarRange className="size-3.5" />
            {subscription.startDate} → {subscription.endDate} · {subscription.businessId}
          </p>
        </div>

        {canManage ? (
          <div className="flex gap-2">
            <Button disabled={isRenewing} onClick={onRenew} size="sm" variant="outline">
              {isRenewing ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RotateCcw className="size-4" />
              )}
              Renew
            </Button>
            <Button
              disabled={isCancelling || isCancelled}
              onClick={onCancel}
              size="sm"
              variant="outline"
            >
              {isCancelling ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <XCircle className="size-4" />
              )}
              Cancel
            </Button>
          </div>
        ) : null}
      </div>

      {subscription.payments.length === 0 ? null : (
        <ul className="mt-3 space-y-1.5 border-t border-(--sm-border) pt-3">
          {subscription.payments.map((payment) => (
            <PaymentRow
              canManage={canManage}
              isPending={pendingPaymentId === payment.id}
              key={payment.id}
              onMarkPaid={() => onMarkPaid(payment.id)}
              payment={payment}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

function PaymentRow({ canManage, isPending, onMarkPaid, payment }: PaymentRowProps) {
  const isSettled = payment.status === 'paid' || payment.status === 'cancelled';

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 text-xs">
      <span className="flex items-center gap-1.5 text-(--sm-muted)">
        <CreditCard className="size-3.5" />
        {payment.businessId} · {payment.amount} {payment.currencyCode} · due {payment.dueDate}
      </span>
      <span className="flex items-center gap-2">
        <StatusBadge tone={statusTone(payment.status)}>{payment.status}</StatusBadge>
        {isSettled && payment.status === 'paid' ? (
          <BadgeCheck className="size-3.5 text-(--sm-emerald)" />
        ) : null}
        {!isSettled && canManage ? (
          <Button disabled={isPending} onClick={onMarkPaid} size="sm" variant="ghost">
            {isPending ? <Loader2 className="size-3.5 animate-spin" /> : null}
            Mark paid
          </Button>
        ) : null}
      </span>
    </li>
  );
}

function statusTone(status: string): StatusTone {
  if (status === 'active' || status === 'paid') {
    return 'positive';
  }

  if (status === 'cancelled' || status === 'overdue') {
    return 'critical';
  }

  if (status === 'unpaid' || status === 'pending') {
    return 'caution';
  }

  return 'neutral';
}

type MutationLike = {
  mutate: (
    id: string,
    options: { onError: (error: unknown) => void; onSuccess: () => void }
  ) => void;
};

type SubscriptionCardProps = {
  canManage: boolean;
  isCancelling: boolean;
  isRenewing: boolean;
  onCancel: () => void;
  onMarkPaid: (paymentId: string) => void;
  onRenew: () => void;
  pendingPaymentId: string | null | undefined;
  subscription: CustomerSubscription;
};

type PaymentRowProps = {
  canManage: boolean;
  isPending: boolean;
  onMarkPaid: () => void;
  payment: HubPayment;
};
