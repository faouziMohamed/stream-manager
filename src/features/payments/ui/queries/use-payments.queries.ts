'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createPaymentAction,
  type CreatePaymentActionInput,
} from '@/features/payments/server/actions/create-payment.action';
import {
  listPaymentsAction,
  listPaymentsPageAction,
} from '@/features/payments/server/actions/list-payments.action';
import type {
  PaymentsPageInput,
  PaymentsPagePayload,
} from '@/features/payments/server/loaders/payments.loader';
import { markPaymentPaidAction } from '@/features/payments/server/actions/mark-payment-paid.action';
import { useAuthRecoveredOperation } from '@/lib/auth/use-auth-recovered-operation';
import type {
  ListMembershipCustomerOptionsQuery,
  ListMembershipsQuery,
  ListPaymentsQuery,
} from '@/lib/graphql/generated/graphql';
import { clientLogger } from '@/lib/logger/client-logger';

export const PAYMENTS_QUERY_KEY = ['payments', 'list'] as const;
export const PAYMENTS_PAGE_KEY = ['payments', 'page'] as const;

const log = clientLogger('use-payments');

export type PaymentsListPayload = {
  cancelledCount: number;
  customerOptions: ListMembershipCustomerOptionsQuery['customers']['items'];
  items: ListPaymentsQuery['payments']['items'];
  membershipOptions: ListMembershipsQuery['memberships']['items'];
  overdueCount: number;
  paidCount: number;
  total: number;
  unpaidCount: number;
};

export function usePayments(initialData: PaymentsListPayload) {
  const recoverOperation = useAuthRecoveredOperation();

  return useQuery({
    queryKey: PAYMENTS_QUERY_KEY,
    queryFn: () => recoverOperation(() => listPaymentsAction()),
    initialData,
  });
}

/**
 * One page of the ledger or the agenda, with the counts the chips carry.
 *
 * `keepPreviousData` so flipping pages does not blank the table while the next
 * page loads — a pager that empties the screen on click reads as a bug.
 */
export function usePaymentsPage(initialData: PaymentsPagePayload, input: PaymentsPageInput) {
  const recoverOperation = useAuthRecoveredOperation();

  return useQuery({
    initialData,
    // The server-rendered first page is a seed, not a cache entry. Without
    // this the query inherits the provider's 30s `staleTime`, so every other
    // page and every status filter would render the first page's rows and
    // never fetch — the pager would look broken.
    initialDataUpdatedAt: 0,
    placeholderData: (previous) => previous,
    queryFn: () => recoverOperation(() => listPaymentsPageAction(input)),
    queryKey: [
      ...PAYMENTS_PAGE_KEY,
      input.order ?? 'desc',
      input.status ?? 'all',
      input.page,
      input.pageSize,
    ],
  });
}

export function useCreatePayment() {
  const recoverOperation = useAuthRecoveredOperation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreatePaymentActionInput) =>
      recoverOperation(() => createPaymentAction(input)),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: PAYMENTS_QUERY_KEY });
      return { snapshot: queryClient.getQueryData<PaymentsListPayload>(PAYMENTS_QUERY_KEY) };
    },
    onError: (_error, _input, context) => {
      log.error('Record payment failed, rolling back');
      if (context?.snapshot !== undefined) {
        queryClient.setQueryData(PAYMENTS_QUERY_KEY, context.snapshot);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: PAYMENTS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: PAYMENTS_PAGE_KEY });
    },
  });
}

function settle<T extends { status: string }>(payment: T): T {
  return { ...payment, paidDate: new Date().toISOString(), status: 'paid' };
}

export function useMarkPaymentPaid() {
  const recoverOperation = useAuthRecoveredOperation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => recoverOperation(() => markPaymentPaidAction(id)),

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: PAYMENTS_QUERY_KEY });
      await queryClient.cancelQueries({ queryKey: PAYMENTS_PAGE_KEY });
      const snapshot = queryClient.getQueryData<PaymentsListPayload>(PAYMENTS_QUERY_KEY);
      const pageSnapshots = queryClient.getQueriesData<PaymentsPagePayload>({
        queryKey: PAYMENTS_PAGE_KEY,
      });

      queryClient.setQueryData<PaymentsListPayload>(PAYMENTS_QUERY_KEY, (prev) => {
        if (prev === undefined) return prev;
        const previous = prev.items.find((payment) => payment.id === id);
        return {
          ...prev,
          items: prev.items.map((payment) => (payment.id === id ? settle(payment) : payment)),
          paidCount: previous?.status === 'paid' ? prev.paidCount : prev.paidCount + 1,
          overdueCount:
            previous?.status === 'overdue' ? Math.max(prev.overdueCount - 1, 0) : prev.overdueCount,
          unpaidCount:
            previous?.status === 'unpaid' ? Math.max(prev.unpaidCount - 1, 0) : prev.unpaidCount,
        };
      });

      // The ledger and the agenda read a paged cache of their own, so the same
      // row has to settle in both or the table and the list would disagree
      // until the refetch lands.
      for (const [key, page] of pageSnapshots) {
        if (page === undefined) continue;
        queryClient.setQueryData<PaymentsPagePayload>(key, {
          ...page,
          items: page.items.map((payment) => (payment.id === id ? settle(payment) : payment)),
        });
      }

      return { pageSnapshots, snapshot };
    },

    onError: (_error, _id, context) => {
      log.error('Mark payment paid failed, rolling back');
      if (context?.snapshot !== undefined) {
        queryClient.setQueryData(PAYMENTS_QUERY_KEY, context.snapshot);
      }
      for (const [key, page] of context?.pageSnapshots ?? []) {
        queryClient.setQueryData(key, page);
      }
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: PAYMENTS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: PAYMENTS_PAGE_KEY });
    },
  });
}
