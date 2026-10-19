'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  assignProfileToMembershipAction,
  createStreamingProfileAction,
  deleteStreamingProfileAction,
  unassignProfileAction,
  updateStreamingProfileAction,
} from '@/features/streaming-accounts/server/actions/streaming-accounts.action';
import type { StreamingAssignmentFormValues } from '@/features/streaming-accounts/shared/streaming-account-form.schema';
import type { StreamingProfileValues } from '@/features/streaming-accounts/shared/streaming-profile.schema';
import {
  STREAMING_ACCOUNTS_QUERY_KEY,
  type StreamingAccountsPayload,
} from '@/features/streaming-accounts/ui/queries/use-streaming-accounts.queries';
import { useAuthRecoveredOperation } from '@/lib/auth/use-auth-recovered-operation';
import type { UpdateStreamingProfileMutationVariables } from '@/lib/graphql/generated/graphql';
import { clientLogger } from '@/lib/logger/client-logger';

export function useCreateStreamingProfile() {
  const recoverOperation = useAuthRecoveredOperation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ accountId, values }: { accountId: string; values: StreamingProfileValues }) =>
      recoverOperation(() => createStreamingProfileAction(accountId, values)),
    onMutate: async ({ accountId, values }) => {
      await queryClient.cancelQueries({ queryKey: STREAMING_ACCOUNTS_QUERY_KEY });
      const snapshot = queryClient.getQueryData<StreamingAccountsPayload>(
        STREAMING_ACCOUNTS_QUERY_KEY
      );
      queryClient.setQueryData<StreamingAccountsPayload>(STREAMING_ACCOUNTS_QUERY_KEY, (prev) => {
        if (prev === undefined) return prev;
        return {
          ...prev,
          items: prev.items.map((account) =>
            account.id === accountId
              ? {
                  ...account,
                  profiles: [
                    ...(account.profiles ?? []),
                    {
                      assignedAt: null,
                      assignmentId: null,
                      id: `optimistic-${Date.now()}`,
                      isAssigned: false,
                      membershipId: null,
                      name: values.name,
                    },
                  ],
                }
              : account
          ),
        };
      });
      return { snapshot };
    },
    onError: (_error, _vars, context) => {
      log.error('Create streaming profile failed, rolling back');
      if (context?.snapshot !== undefined) {
        queryClient.setQueryData(STREAMING_ACCOUNTS_QUERY_KEY, context.snapshot);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: STREAMING_ACCOUNTS_QUERY_KEY });
    },
  });
}

export function useAssignProfileToMembership(accountId: string) {
  const recoverOperation = useAuthRecoveredOperation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: StreamingAssignmentFormValues) =>
      recoverOperation(() => assignProfileToMembershipAction({ accountId, ...values })),
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
            ...previous,
            items: previous.items.map((account) =>
              account.id === accountId
                ? {
                    ...account,
                    profiles:
                      account.profiles === null
                        ? null
                        : account.profiles.map((profile) =>
                            profile.id === values.profileId
                              ? { ...profile, isAssigned: true }
                              : profile
                          ),
                  }
                : account
            ),
          };
        }
      );
      return { snapshot };
    },
    onError: (_error, _values, context) => {
      log.error('Assign streaming profile failed, rolling back');
      if (context?.snapshot !== undefined) {
        queryClient.setQueryData(STREAMING_ACCOUNTS_QUERY_KEY, context.snapshot);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: STREAMING_ACCOUNTS_QUERY_KEY });
    },
  });
}

export function useUpdateStreamingProfile() {
  const recoverOperation = useAuthRecoveredOperation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateStreamingProfileMutationVariables['input']) =>
      recoverOperation(() => updateStreamingProfileAction(input)),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: STREAMING_ACCOUNTS_QUERY_KEY });
      const snapshot = queryClient.getQueryData<StreamingAccountsPayload>(
        STREAMING_ACCOUNTS_QUERY_KEY
      );
      if (typeof input.name === 'string') {
        const name = input.name;
        queryClient.setQueryData<StreamingAccountsPayload>(STREAMING_ACCOUNTS_QUERY_KEY, (prev) => {
          if (prev === undefined) return prev;
          return {
            ...prev,
            items: prev.items.map((account) => ({
              ...account,
              profiles:
                account.profiles === null
                  ? null
                  : account.profiles.map((profile) =>
                      profile.id === input.id ? { ...profile, name } : profile
                    ),
            })),
          };
        });
      }
      return { snapshot };
    },
    onError: (_error, _input, context) => {
      log.error('Update streaming profile failed, rolling back');
      if (context?.snapshot !== undefined) {
        queryClient.setQueryData(STREAMING_ACCOUNTS_QUERY_KEY, context.snapshot);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: STREAMING_ACCOUNTS_QUERY_KEY });
    },
  });
}

export function useDeleteStreamingProfile() {
  const recoverOperation = useAuthRecoveredOperation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ profileId }: { accountId: string; profileId: string }) =>
      recoverOperation(() => deleteStreamingProfileAction(profileId)),
    onMutate: async ({ accountId, profileId }) => {
      await queryClient.cancelQueries({ queryKey: STREAMING_ACCOUNTS_QUERY_KEY });
      const snapshot = queryClient.getQueryData<StreamingAccountsPayload>(
        STREAMING_ACCOUNTS_QUERY_KEY
      );
      queryClient.setQueryData<StreamingAccountsPayload>(
        STREAMING_ACCOUNTS_QUERY_KEY,
        (previous) => {
          if (previous === undefined) return previous;
          return {
            ...previous,
            items: previous.items.map((account) =>
              account.id === accountId
                ? {
                    ...account,
                    profiles:
                      account.profiles === null
                        ? null
                        : account.profiles.filter((profile) => profile.id !== profileId),
                  }
                : account
            ),
          };
        }
      );
      return { snapshot };
    },
    onError: (_error, _vars, context) => {
      log.error('Delete streaming profile failed, rolling back');
      if (context?.snapshot !== undefined) {
        queryClient.setQueryData(STREAMING_ACCOUNTS_QUERY_KEY, context.snapshot);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: STREAMING_ACCOUNTS_QUERY_KEY });
    },
  });
}

export function useUnassignProfile() {
  const recoverOperation = useAuthRecoveredOperation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      assignmentId,
    }: {
      accountId: string;
      assignmentId: string;
      profileId: string;
    }) => recoverOperation(() => unassignProfileAction(assignmentId)),
    onMutate: async ({ accountId, profileId }) => {
      await queryClient.cancelQueries({ queryKey: STREAMING_ACCOUNTS_QUERY_KEY });
      const snapshot = queryClient.getQueryData<StreamingAccountsPayload>(
        STREAMING_ACCOUNTS_QUERY_KEY
      );
      queryClient.setQueryData<StreamingAccountsPayload>(
        STREAMING_ACCOUNTS_QUERY_KEY,
        (previous) => {
          if (previous === undefined) return previous;
          return {
            ...previous,
            items: previous.items.map((account) =>
              account.id === accountId
                ? {
                    ...account,
                    profiles:
                      account.profiles === null
                        ? null
                        : account.profiles.map((profile) =>
                            profile.id === profileId
                              ? {
                                  ...profile,
                                  assignmentId: null,
                                  isAssigned: false,
                                  membershipId: null,
                                }
                              : profile
                          ),
                  }
                : account
            ),
          };
        }
      );
      return { snapshot };
    },
    onError: (_error, _values, context) => {
      log.error('Unassign streaming profile failed, rolling back');
      if (context?.snapshot !== undefined) {
        queryClient.setQueryData(STREAMING_ACCOUNTS_QUERY_KEY, context.snapshot);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: STREAMING_ACCOUNTS_QUERY_KEY });
    },
  });
}

const log = clientLogger('use-streaming-profiles');
