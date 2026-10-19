'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createStreamingAccountAction,
  deleteStreamingAccountAction,
  listStreamingAccountsAction,
  updateStreamingAccountAction,
} from '@/features/streaming-accounts/server/actions/streaming-accounts.action';
import type {
  StreamingAccountFormValues,
  StreamingAccountUpdateValues,
} from '@/features/streaming-accounts/shared/streaming-account-form.schema';
import { useAuthRecoveredOperation } from '@/lib/auth/use-auth-recovered-operation';
import type {
  ListStreamingAccountsQuery,
  UpdateStreamingAccountMutationVariables,
} from '@/lib/graphql/generated/graphql';
import { clientLogger } from '@/lib/logger/client-logger';

export const STREAMING_ACCOUNTS_QUERY_KEY = ['streaming-accounts', 'list'] as const;

const log = clientLogger('use-streaming-accounts');

export type StreamingAccountsPayload = {
  items: ListStreamingAccountsQuery['streamingAccounts'];
  total: number;
};

export function useStreamingAccounts(initialData: StreamingAccountsPayload) {
  const recoverOperation = useAuthRecoveredOperation();

  return useQuery({
    queryKey: STREAMING_ACCOUNTS_QUERY_KEY,
    queryFn: () => recoverOperation(() => listStreamingAccountsAction()),
    initialData,
  });
}

export function useCreateStreamingAccount() {
  const recoverOperation = useAuthRecoveredOperation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: StreamingAccountFormValues) =>
      recoverOperation(() =>
        createStreamingAccountAction({
          email: values.email === '' ? null : values.email,
          label: values.label,
          maxProfiles: values.maxProfiles,
          password: values.password === '' ? null : values.password,
          serviceId: values.serviceId,
          supportsProfiles: values.supportsProfiles,
        })
      ),
    onMutate: async (values) => {
      await queryClient.cancelQueries({ queryKey: STREAMING_ACCOUNTS_QUERY_KEY });
      const snapshot = queryClient.getQueryData<StreamingAccountsPayload>(
        STREAMING_ACCOUNTS_QUERY_KEY
      );
      queryClient.setQueryData<StreamingAccountsPayload>(
        STREAMING_ACCOUNTS_QUERY_KEY,
        (previous) => {
          if (previous === undefined) return previous;
          return {
            items: [
              {
                createdAt: new Date().toISOString(),
                email: values.email === '' ? null : values.email,
                id: `optimistic-${Date.now()}`,
                isActive: true,
                label: values.label,
                maxProfiles: values.maxProfiles,
                profiles: [],
                serviceId: values.serviceId,
                supportsProfiles: values.supportsProfiles,
              },
              ...previous.items,
            ],
            total: previous.total + 1,
          };
        }
      );
      return { snapshot };
    },
    onError: (_error, _values, context) => {
      log.error('Create streaming account failed, rolling back');
      if (context?.snapshot !== undefined) {
        queryClient.setQueryData(STREAMING_ACCOUNTS_QUERY_KEY, context.snapshot);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: STREAMING_ACCOUNTS_QUERY_KEY });
    },
  });
}

export function useUpdateStreamingAccount() {
  const recoverOperation = useAuthRecoveredOperation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: StreamingAccountUpdateValues }) =>
      recoverOperation(() =>
        // `password` is deliberately absent: the edit form has no password
        // field, and the use case reads null as "clear it", so sending either
        // null or an explicit undefined-key wiped the account's password
        // whenever someone renamed it. Omitting the key leaves it untouched.
        updateStreamingAccountAction({
          id,
          email: values.email === '' ? null : (values.email ?? null),
          label: values.label ?? null,
          maxProfiles: values.maxProfiles ?? null,
          supportsProfiles: values.supportsProfiles ?? null,
        } as UpdateStreamingAccountMutationVariables['input'])
      ),
    onMutate: async ({ id, values }) => {
      await queryClient.cancelQueries({ queryKey: STREAMING_ACCOUNTS_QUERY_KEY });
      const snapshot = queryClient.getQueryData<StreamingAccountsPayload>(
        STREAMING_ACCOUNTS_QUERY_KEY
      );
      queryClient.setQueryData<StreamingAccountsPayload>(STREAMING_ACCOUNTS_QUERY_KEY, (prev) => {
        if (prev === undefined) return prev;
        return {
          ...prev,
          items: prev.items.map((account) =>
            account.id === id
              ? {
                  ...account,
                  ...(values.email !== undefined && {
                    email: values.email === '' ? null : (values.email ?? null),
                  }),
                  ...(values.label !== undefined && { label: values.label ?? account.label }),
                  ...(values.maxProfiles !== undefined &&
                    values.maxProfiles !== null && { maxProfiles: values.maxProfiles }),
                  ...(values.supportsProfiles !== undefined &&
                    values.supportsProfiles !== null && {
                      supportsProfiles: values.supportsProfiles,
                    }),
                }
              : account
          ),
        };
      });
      return { snapshot };
    },
    onError: (_error, _vars, context) => {
      log.error('Update streaming account failed, rolling back');
      if (context?.snapshot !== undefined) {
        queryClient.setQueryData(STREAMING_ACCOUNTS_QUERY_KEY, context.snapshot);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: STREAMING_ACCOUNTS_QUERY_KEY });
    },
  });
}

export function useDeleteStreamingAccount() {
  const recoverOperation = useAuthRecoveredOperation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => recoverOperation(() => deleteStreamingAccountAction(id)),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: STREAMING_ACCOUNTS_QUERY_KEY });
      const snapshot = queryClient.getQueryData<StreamingAccountsPayload>(
        STREAMING_ACCOUNTS_QUERY_KEY
      );
      queryClient.setQueryData<StreamingAccountsPayload>(
        STREAMING_ACCOUNTS_QUERY_KEY,
        (previous) => {
          if (previous === undefined) return previous;
          return {
            items: previous.items.filter((account) => account.id !== id),
            total: Math.max(previous.total - 1, 0),
          };
        }
      );
      return { snapshot };
    },
    onError: (_error, _id, context) => {
      log.error('Delete streaming account failed, rolling back');
      if (context?.snapshot !== undefined) {
        queryClient.setQueryData(STREAMING_ACCOUNTS_QUERY_KEY, context.snapshot);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: STREAMING_ACCOUNTS_QUERY_KEY });
    },
  });
}
