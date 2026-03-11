'use client';

import {type QueryKey, useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {gqlRequest} from '@/lib/graphql/client';
import {
  type AppSettingDto,
  CREATE_SUMMARY_LINK,
  DELETE_SUMMARY_LINK,
  GET_DEFAULT_CURRENCY,
  GET_SUMMARY_LINKS,
  SET_APP_SETTING,
  type SummaryLinkDto,
  TOGGLE_SUMMARY_LINK,
} from '@/lib/graphql/operations/settings.operations';
import {toastError} from '@/lib/utils/toast';


export const settingsKeys = {
    currency: ['settings', 'defaultCurrency'] as QueryKey,
    summaryLinks: ['settings', 'summaryLinks'] as QueryKey,
};

export function useDefaultCurrency(initialData?: string) {
    return useQuery({
        queryKey: settingsKeys.currency,
        queryFn: () =>
            gqlRequest<{ defaultCurrency: string }>(GET_DEFAULT_CURRENCY).then(
                (r) => r.defaultCurrency,
            ),
        initialData,
        staleTime: 5 * 60_000, // 5 minutes
    });
}

export function useSetDefaultCurrency() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (currency: string) =>
            gqlRequest<{ setAppSetting: AppSettingDto }>(SET_APP_SETTING, {
                key: 'defaultCurrency',
                value: currency,
            }).then((r) => r.setAppSetting),
        onMutate: async (currency) => {
            await qc.cancelQueries({queryKey: settingsKeys.currency});
            const prev = qc.getQueryData<string>(settingsKeys.currency);
            qc.setQueryData(settingsKeys.currency, currency);
            return {prev};
        },
        onError: (err, _, ctx) => {
            toastError(err, 'Changement de devise');
            if (ctx?.prev) qc.setQueryData(settingsKeys.currency, ctx.prev);
        },
        onSettled: () => qc.invalidateQueries({queryKey: settingsKeys.currency}),
    });
}

export function useSummaryLinks(initialData?: SummaryLinkDto[]) {
    return useQuery({
        queryKey: settingsKeys.summaryLinks,
        queryFn: () =>
            gqlRequest<{ summaryLinks: SummaryLinkDto[] }>(GET_SUMMARY_LINKS).then(
                (r) => r.summaryLinks,
            ),
        initialData,
    });
}

export function useCreateSummaryLink() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (input: { label?: string; showSensitiveInfo: boolean; expiresAt?: string }) =>
            gqlRequest<{ createSummaryLink: SummaryLinkDto }>(CREATE_SUMMARY_LINK, input).then(
                (r) => r.createSummaryLink,
            ),
        onError: (err) => toastError(err, 'Création du lien de partage'),
        onSettled: () => qc.invalidateQueries({queryKey: settingsKeys.summaryLinks}),
    });
}

export function useDeleteSummaryLink() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) =>
            gqlRequest<{ deleteSummaryLink: boolean }>(DELETE_SUMMARY_LINK, {id}).then(
                (r) => r.deleteSummaryLink,
            ),
        onMutate: async (id) => {
            await qc.cancelQueries({queryKey: settingsKeys.summaryLinks});
            const prev = qc.getQueryData<SummaryLinkDto[]>(settingsKeys.summaryLinks);
            qc.setQueryData<SummaryLinkDto[]>(settingsKeys.summaryLinks, (old) =>
                old?.filter((l) => l.id !== id) ?? [],
            );
            return {prev};
        },
        onError: (err, _, ctx) => {
            toastError(err, 'Suppression du lien de partage');
            if (ctx?.prev) qc.setQueryData(settingsKeys.summaryLinks, ctx.prev);
        },
        onSettled: () => qc.invalidateQueries({queryKey: settingsKeys.summaryLinks}),
    });
}

export function useToggleSummaryLink() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({id, isActive}: { id: string; isActive: boolean }) =>
            gqlRequest<{ toggleSummaryLink: SummaryLinkDto }>(TOGGLE_SUMMARY_LINK, {id, isActive}).then(
                (r) => r.toggleSummaryLink,
            ),
        onMutate: async ({id, isActive}) => {
            await qc.cancelQueries({queryKey: settingsKeys.summaryLinks});
            const prev = qc.getQueryData<SummaryLinkDto[]>(settingsKeys.summaryLinks);
            qc.setQueryData<SummaryLinkDto[]>(settingsKeys.summaryLinks, (old) =>
                old?.map((l) => (l.id === id ? {...l, isActive} : l)) ?? [],
            );
            return {prev};
        },
        onError: (err, _, ctx) => {
            toastError(err, 'Activation du lien de partage');
            if (ctx?.prev) qc.setQueryData(settingsKeys.summaryLinks, ctx.prev);
        },
        onSettled: () => qc.invalidateQueries({queryKey: settingsKeys.summaryLinks}),
    });
}
