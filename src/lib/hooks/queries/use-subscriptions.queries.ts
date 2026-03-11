'use client';

import {useQuery, useMutation, useQueryClient, type QueryKey} from '@tanstack/react-query';
import {gqlRequest} from '@/lib/graphql/client';
import {
    GET_SUBSCRIPTIONS,
    GET_SUBSCRIPTION,
    CREATE_SUBSCRIPTION,
    UPDATE_SUBSCRIPTION,
    DELETE_SUBSCRIPTION,
    RENEW_SUBSCRIPTION,
    type SubscriptionDto,
    type CreateSubscriptionInput,
    type UpdateSubscriptionInput,
    type RenewSubscriptionInput,
    type SubscriptionStatus,
} from '@/lib/graphql/operations/subscriptions.operations';
import {clientLogger} from '@/lib/logger/client-logger';

const logger = clientLogger('use-subscriptions-queries');

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
        onError: (err) => logger.error('createSubscription failed', err),
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
            logger.error('updateSubscription failed', err);
            if (ctx?.prev) qc.setQueryData(subscriptionKeys.all, ctx.prev);
        },
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
            logger.error('deleteSubscription failed', err);
            if (ctx?.prev) qc.setQueryData(subscriptionKeys.all, ctx.prev);
        },
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
        onError: (err) => logger.error('renewSubscription failed', err),
        onSettled: () => {
            qc.invalidateQueries({queryKey: subscriptionKeys.all});
            qc.invalidateQueries({queryKey: ['payments']});
            qc.invalidateQueries({queryKey: ['dashboardStats']});
        },
    });
}
