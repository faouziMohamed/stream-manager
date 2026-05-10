'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { gqlRequest } from '@/lib/graphql/client';
import {
  type SummaryLinkDto,
  CREATE_SUMMARY_LINK,
  DELETE_SUMMARY_LINK,
  GET_SUMMARY_LINKS,
  TOGGLE_SUMMARY_LINK,
} from '@/modules/settings/client/graphql/summary-links.operations';
import { settingsKeys } from '@/modules/settings/client/queries/use-settings.queries';
import { toastError, toastSuccess } from '@/lib/utils/toast';

export function useSummaryLinks(initialData?: SummaryLinkDto[]) {
  return useQuery({
    queryKey: settingsKeys.summaryLinks,
    queryFn: () =>
      gqlRequest<{ summaryLinks: SummaryLinkDto[] }>(GET_SUMMARY_LINKS).then((r) => r.summaryLinks),
    initialData,
  });
}

export function useCreateSummaryLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { label?: string; showSensitiveInfo: boolean; expiresAt?: string }) =>
      gqlRequest<{ createSummaryLink: SummaryLinkDto }>(CREATE_SUMMARY_LINK, input).then(
        (r) => r.createSummaryLink
      ),
    onSuccess: () => toastSuccess('Lien de partage créé'),
    onError: (err) => toastError(err, 'Création du lien de partage'),
    onSettled: () => qc.invalidateQueries({ queryKey: settingsKeys.summaryLinks }),
  });
}

export function useDeleteSummaryLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      gqlRequest<{ deleteSummaryLink: boolean }>(DELETE_SUMMARY_LINK, {
        id,
      }).then((r) => r.deleteSummaryLink),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: settingsKeys.summaryLinks });
      const prev = qc.getQueryData<SummaryLinkDto[]>(settingsKeys.summaryLinks);
      qc.setQueryData<SummaryLinkDto[]>(
        settingsKeys.summaryLinks,
        (old) => old?.filter((l) => l.id !== id) ?? []
      );
      return { prev };
    },
    onError: (err, _, ctx) => {
      toastError(err, 'Suppression du lien de partage');
      if (ctx?.prev) qc.setQueryData(settingsKeys.summaryLinks, ctx.prev);
    },
    onSuccess: () => toastSuccess('Lien de partage supprimé'),
    onSettled: () => qc.invalidateQueries({ queryKey: settingsKeys.summaryLinks }),
  });
}

export function useToggleSummaryLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      gqlRequest<{ toggleSummaryLink: SummaryLinkDto }>(TOGGLE_SUMMARY_LINK, {
        id,
        isActive,
      }).then((r) => r.toggleSummaryLink),
    onMutate: async ({ id, isActive }) => {
      await qc.cancelQueries({ queryKey: settingsKeys.summaryLinks });
      const prev = qc.getQueryData<SummaryLinkDto[]>(settingsKeys.summaryLinks);
      qc.setQueryData<SummaryLinkDto[]>(
        settingsKeys.summaryLinks,
        (old) => old?.map((l) => (l.id === id ? { ...l, isActive } : l)) ?? []
      );
      return { prev };
    },
    onError: (err, _, ctx) => {
      toastError(err, 'Activation du lien de partage');
      if (ctx?.prev) qc.setQueryData(settingsKeys.summaryLinks, ctx.prev);
    },
    onSuccess: (_data: SummaryLinkDto, vars: { id: string; isActive: boolean }) =>
      toastSuccess(vars.isActive ? 'Lien activé' : 'Lien désactivé'),
    onSettled: () => qc.invalidateQueries({ queryKey: settingsKeys.summaryLinks }),
  });
}
