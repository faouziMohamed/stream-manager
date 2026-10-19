'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getCustomerHubAction } from '@/features/customers/server/actions/customer-hub.action';
import {
  cancelMembershipAction,
  renewMembershipAction,
} from '@/features/memberships/server/actions/mutate-membership.action';
import { markPaymentPaidAction } from '@/features/payments/server/actions/mark-payment-paid.action';
import type { CustomerHub } from '@/features/customers/shared/customer-hub.mapper';
import { useAuthRecoveredOperation } from '@/lib/auth/use-auth-recovered-operation';
import { clientLogger } from '@/lib/logger/client-logger';

const log = clientLogger('use-customer-hub');

export function customerHubQueryKey(customerId: string) {
  return ['customers', 'hub', customerId] as const;
}

export function useCustomerHub(customerId: string, initialData: CustomerHub) {
  const recoverOperation = useAuthRecoveredOperation();

  return useQuery({
    queryKey: customerHubQueryKey(customerId),
    queryFn: () => recoverOperation(() => getCustomerHubAction(customerId)),
    initialData,
  });
}

export function useCancelSubscription(customerId: string) {
  return useHubMutation(customerId, 'Cancel subscription', cancelMembershipAction, (hub, id) => ({
    ...hub,
    subscriptions: hub.subscriptions.map((subscription) =>
      subscription.id === id ? { ...subscription, status: 'cancelled' } : subscription
    ),
  }));
}

export function useRenewSubscription(customerId: string) {
  // Renewal creates a new subscription server-side, so there is nothing
  // sensible to show optimistically — the invalidate in onSettled refills it.
  // The hub renews one plain term; the memberships ledger offers the term count.
  return useHubMutation(
    customerId,
    'Renew subscription',
    (id: string) => renewMembershipAction({ id, markPaid: false, terms: 1 }),
    (hub) => hub
  );
}

export function useMarkPaymentPaid(customerId: string) {
  return useHubMutation(customerId, 'Mark payment paid', markPaymentPaidAction, (hub, id) => ({
    ...hub,
    subscriptions: hub.subscriptions.map((subscription) => ({
      ...subscription,
      payments: subscription.payments.map((payment) =>
        payment.id === id ? { ...payment, status: 'paid' } : payment
      ),
    })),
  }));
}

/**
 * Shared optimistic shape for the hub's three actions: snapshot, apply the
 * local change, roll back on failure, always re-read on settle.
 */
function useHubMutation(
  customerId: string,
  label: string,
  action: (id: string) => Promise<unknown>,
  apply: (hub: CustomerHub, id: string) => CustomerHub
) {
  const recoverOperation = useAuthRecoveredOperation();
  const queryClient = useQueryClient();
  const queryKey = customerHubQueryKey(customerId);

  return useMutation({
    mutationFn: (id: string) => recoverOperation(() => action(id)),

    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey });
      const snapshot = queryClient.getQueryData<CustomerHub>(queryKey);

      queryClient.setQueryData<CustomerHub>(queryKey, (previous) =>
        previous === undefined ? previous : apply(previous, id)
      );

      return { snapshot };
    },

    onError: (_error, _id, context) => {
      log.error(`${label} failed, rolling back`);

      if (context?.snapshot !== undefined) {
        queryClient.setQueryData(queryKey, context.snapshot);
      }
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });
}
