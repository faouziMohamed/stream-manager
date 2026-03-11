'use client';

import {type QueryKey, useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {gqlRequest} from '@/lib/graphql/client';
import {
    CREATE_SUBSCRIPTION,
    type CreateSubscriptionInput,
    DELETE_SUBSCRIPTION,
    GET_SUBSCRIPTION,
    GET_SUBSCRIPTIONS,
    RENEW_SUBSCRIPTION,
    type RenewSubscriptionInput,
    type SubscriptionDto,
    type SubscriptionStatus,
    UPDATE_SUBSCRIPTION,
    type UpdateSubscriptionInput,
} from '@/lib/graphql/operations/subscriptions.operations';
import {toastError, toastSuccess} from '@/lib/utils/toast';


export const subscriptionKeys = {
    all: ['subscriptions'] as QueryKey,
    filtered: (clientId?: string, status?: SubscriptionStatus) =>
        ['subscriptions', {clientId, status}] as QueryKey,
    detail: (id: string) => ['subscriptions', id] as QueryKey,
};

export function useSubscriptions(
    filters?: { clientId?: string; status?: SubscriptionStatus },
    initialData?: SubscriptionDto[],
) {
    return useQuery({
        queryKey: subscriptionKeys.filtered(filters?.clientId, filters?.status),
        queryFn: () =>
            gqlRequest<{ subscriptions: SubscriptionDto[] }>(GET_SUBSCRIPTIONS, filters).then(
                (r) => r.subscriptions,
            ),
        initialData,
    });
}

export function useSubscription(id: string) {
    return useQuery({
        queryKey: subscriptionKeys.detail(id),
        queryFn: () =>
            gqlRequest<{ subscription: SubscriptionDto }>(GET_SUBSCRIPTION, {id}).then(
                (r) => r.subscription,
            ),
        enabled: !!id,
    });
}

export function useCreateSubscription() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (input: CreateSubscriptionInput) =>
            gqlRequest<{ createSubscription: SubscriptionDto }>(CREATE_SUBSCRIPTION, {input}).then(
                (r) => r.createSubscription,
            ),
        onSuccess: () => toastSuccess('Abonnement créé'),
        onError: (err) => toastError(err, 'Création de l\'abonnement'),
        onSettled: () => {
            qc.invalidateQueries({queryKey: subscriptionKeys.all});
            qc.invalidateQueries({queryKey: ['payments']});
            qc.invalidateQueries({queryKey: ['dashboardStats']});
        },
    });
}

export function useUpdateSubscription() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({id, input}: { id: string; input: UpdateSubscriptionInput }) =>
            gqlRequest<{ updateSubscription: SubscriptionDto }>(UPDATE_SUBSCRIPTION, {id, input}).then(
                (r) => r.updateSubscription,
            ),
        onMutate: async ({id, input}) => {
            await qc.cancelQueries({queryKey: subscriptionKeys.all});
            const prev = qc.getQueryData<SubscriptionDto[]>(subscriptionKeys.all);
            qc.setQueryData<SubscriptionDto[]>(subscriptionKeys.all, (old) =>
                old?.map((s) => (s.id === id ? {...s, ...input} : s)) ?? [],
            );
            return {prev};
        },
        onError: (err, _, ctx) => {
            toastError(err, 'Modification de l\'abonnement');
            if (ctx?.prev) qc.setQueryData(subscriptionKeys.all, ctx.prev);
        },
        onSuccess: () => toastSuccess('Abonnement mis à jour'),
        onSettled: () => {
            qc.invalidateQueries({queryKey: subscriptionKeys.all});
            qc.invalidateQueries({queryKey: ['dashboardStats']});
        },
    });
}

export function useDeleteSubscription() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) =>
            gqlRequest<{ deleteSubscription: boolean }>(DELETE_SUBSCRIPTION, {id}).then(
                (r) => r.deleteSubscription,
            ),
        onMutate: async (id) => {
            await qc.cancelQueries({queryKey: subscriptionKeys.all});
            const prev = qc.getQueryData<SubscriptionDto[]>(subscriptionKeys.all);
            qc.setQueryData<SubscriptionDto[]>(subscriptionKeys.all, (old) =>
                old?.filter((s) => s.id !== id) ?? [],
            );
            return {prev};
        },
        onError: (err, _, ctx) => {
            toastError(err, 'Suppression de l\'abonnement');
            if (ctx?.prev) qc.setQueryData(subscriptionKeys.all, ctx.prev);
        },
        onSuccess: () => toastSuccess('Abonnement supprimé'),
        onSettled: () => {
            qc.invalidateQueries({queryKey: subscriptionKeys.all});
            qc.invalidateQueries({queryKey: ['dashboardStats']});
        },
    });
}

export function useRenewSubscription() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (input: RenewSubscriptionInput) =>
            gqlRequest<{ renewSubscription: SubscriptionDto }>(RENEW_SUBSCRIPTION, {input}).then(
                (r) => r.renewSubscription,
            ),
        onSuccess: () => toastSuccess('Abonnement renouvelé'),
        onError: (err) => toastError(err, 'Renouvellement de l\'abonnement'),
        onSettled: () => {
            qc.invalidateQueries({queryKey: subscriptionKeys.all});
            qc.invalidateQueries({queryKey: ['payments']});
            qc.invalidateQueries({queryKey: ['dashboardStats']});
        },
    });
}
