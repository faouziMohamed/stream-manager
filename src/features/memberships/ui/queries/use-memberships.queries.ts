'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { listMembershipsAction } from '@/features/memberships/server/actions/list-memberships.action';
import {
  cancelMembershipAction,
  createMembershipAction,
  renewMembershipAction,
  type RenewMembershipActionInput,
} from '@/features/memberships/server/actions/mutate-membership.action';
import type { MembershipFormValues } from '@/features/memberships/shared/membership-form.schema';
import type {
  ListMembershipCustomerOptionsQuery,
  ListMembershipsQuery,
  ListMembershipPlanOptionsQuery,
  ListPaymentsQuery,
} from '@/lib/graphql/generated/graphql';
import { useAuthRecoveredOperation } from '@/lib/auth/use-auth-recovered-operation';
import { clientLogger } from '@/lib/logger/client-logger';

export const MEMBERSHIPS_QUERY_KEY = ['memberships', 'list'] as const;

const log = clientLogger('use-memberships');

export type MembershipsListPayload = {
  activeCount: number;
  activeServiceIds: string[];
  customers: ListMembershipCustomerOptionsQuery['customers']['items'];
  items: ListMembershipsQuery['memberships']['items'];
  payments: ListPaymentsQuery['payments']['items'];
  pendingPayments: ListPaymentsQuery['payments']['items'];
  plans: ListMembershipPlanOptionsQuery['plans']['items'];
  recurringCount: number;
  total: number;
};

export function useMemberships(initialData: MembershipsListPayload, customerId?: string) {
  const recoverOperation = useAuthRecoveredOperation();

  return useQuery({
    queryKey: [...MEMBERSHIPS_QUERY_KEY, customerId ?? null],
    queryFn: () => recoverOperation(() => listMembershipsAction(customerId)),
    initialData,
  });
}

export function useCancelMembership() {
  const recoverOperation = useAuthRecoveredOperation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => recoverOperation(() => cancelMembershipAction(id)),
    onMutate: async (id) => updateStatus(queryClient, id, 'cancelled'),
    onError: (_error, _id, context) => rollback(queryClient, context?.snapshots, 'Cancel'),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: MEMBERSHIPS_QUERY_KEY });
    },
  });
}

export function useCreateMembership() {
  const recoverOperation = useAuthRecoveredOperation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: MembershipFormValues) =>
      recoverOperation(() => createMembershipAction(values)),
    onMutate: async (values) => {
      await queryClient.cancelQueries({ queryKey: MEMBERSHIPS_QUERY_KEY });
      const snapshots = queryClient.getQueriesData<MembershipsListPayload>({
        queryKey: MEMBERSHIPS_QUERY_KEY,
      });

      queryClient.setQueriesData<MembershipsListPayload>(
        { queryKey: MEMBERSHIPS_QUERY_KEY },
        (previous) => {
          if (previous === undefined) return previous;
          const optimistic = {
            businessId: 'MBR-…',
            createdAt: new Date().toISOString(),
            customerId: values.customerId,
            endDate: values.startDate,
            id: `optimistic-${Date.now()}`,
            isRecurring: values.isRecurring,
            planId: values.planId,
            renewedFromId: null,
            startDate: values.startDate,
            status: 'active',
            updatedAt: new Date().toISOString(),
          };
          return {
            ...previous,
            activeCount: previous.activeCount + 1,
            items: [optimistic, ...previous.items],
            recurringCount: previous.recurringCount + (values.isRecurring ? 1 : 0),
            total: previous.total + 1,
          };
        }
      );

      return { snapshots };
    },
    onError: (_error, _values, context) => rollback(queryClient, context?.snapshots, 'Create'),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: MEMBERSHIPS_QUERY_KEY });
    },
  });
}

export function useRenewMembership() {
  const recoverOperation = useAuthRecoveredOperation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: RenewMembershipActionInput) =>
      recoverOperation(() => renewMembershipAction(input)),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: MEMBERSHIPS_QUERY_KEY });
      return {
        snapshots: queryClient.getQueriesData<MembershipsListPayload>({
          queryKey: MEMBERSHIPS_QUERY_KEY,
        }),
      };
    },
    onError: (_error, _input, context) => rollback(queryClient, context?.snapshots, 'Renew'),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: MEMBERSHIPS_QUERY_KEY });
    },
  });
}

async function updateStatus(
  queryClient: ReturnType<typeof useQueryClient>,
  id: string,
  status: string
) {
  await queryClient.cancelQueries({ queryKey: MEMBERSHIPS_QUERY_KEY });
  // Every list variant, not the bare prefix: the filtered views are stored
  // under `[..., customerId]`, and writing to the prefix alone created a
  // cache entry nothing rendered.
  const snapshots = queryClient.getQueriesData<MembershipsListPayload>({
    queryKey: MEMBERSHIPS_QUERY_KEY,
  });

  queryClient.setQueriesData<MembershipsListPayload>(
    { queryKey: MEMBERSHIPS_QUERY_KEY },
    (prev) => {
      if (prev === undefined) return prev;
      const wasActive = prev.items.some((item) => item.id === id && item.status === 'active');
      return {
        ...prev,
        activeCount: wasActive ? Math.max(prev.activeCount - 1, 0) : prev.activeCount,
        items: prev.items.map((item) => (item.id === id ? { ...item, status } : item)),
      };
    }
  );

  return { snapshots };
}

function rollback(
  queryClient: ReturnType<typeof useQueryClient>,
  snapshots: [readonly unknown[], MembershipsListPayload | undefined][] | undefined,
  operation: string
) {
  log.error(`${operation} membership failed, rolling back`);
  for (const [key, snapshot] of snapshots ?? []) {
    if (snapshot !== undefined) queryClient.setQueryData(key, snapshot);
  }
}
