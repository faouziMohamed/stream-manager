'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  generateSummaryLinkAction,
  listSummaryLinksAction,
  revokeSummaryLinkAction,
} from '@/features/summary/server/actions/summary-links.action';
import { useAuthRecoveredOperation } from '@/lib/auth/use-auth-recovered-operation';
import type { ListSummaryLinksQuery } from '@/lib/graphql/generated/graphql';
import { clientLogger } from '@/lib/logger/client-logger';

export const SUMMARY_LINKS_QUERY_KEY = ['summary-links', 'list'] as const;

const log = clientLogger('use-summary-links');

export type SummaryLinksPayload = {
  items: ListSummaryLinksQuery['summaryLinks'];
};

export function useSummaryLinks(initialData: SummaryLinksPayload) {
  const recoverOperation = useAuthRecoveredOperation();

  return useQuery({
    queryKey: SUMMARY_LINKS_QUERY_KEY,
    queryFn: () => recoverOperation(() => listSummaryLinksAction()),
    initialData,
  });
}

export function useGenerateSummaryLink() {
  const recoverOperation = useAuthRecoveredOperation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (options?: { label?: string; expiresInDays?: number }) =>
      recoverOperation(() => generateSummaryLinkAction(options)),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: SUMMARY_LINKS_QUERY_KEY });
      return { snapshot: queryClient.getQueryData<SummaryLinksPayload>(SUMMARY_LINKS_QUERY_KEY) };
    },
    onError: (_error, _options, context) => {
      log.error('Generate summary link failed, rolling back');
      if (context?.snapshot !== undefined) {
        queryClient.setQueryData(SUMMARY_LINKS_QUERY_KEY, context.snapshot);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: SUMMARY_LINKS_QUERY_KEY });
    },
  });
}

export function useRevokeSummaryLink() {
  const recoverOperation = useAuthRecoveredOperation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => recoverOperation(() => revokeSummaryLinkAction(id)),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: SUMMARY_LINKS_QUERY_KEY });
      const snapshot = queryClient.getQueryData<SummaryLinksPayload>(SUMMARY_LINKS_QUERY_KEY);
      queryClient.setQueryData<SummaryLinksPayload>(SUMMARY_LINKS_QUERY_KEY, (prev) => {
        if (prev === undefined) return prev;
        return { items: prev.items.filter((link) => link.id !== id) };
      });
      return { snapshot };
    },
    onError: (_error, _id, context) => {
      log.error('Revoke summary link failed, rolling back');
      if (context?.snapshot !== undefined) {
        queryClient.setQueryData(SUMMARY_LINKS_QUERY_KEY, context.snapshot);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: SUMMARY_LINKS_QUERY_KEY });
    },
  });
}
