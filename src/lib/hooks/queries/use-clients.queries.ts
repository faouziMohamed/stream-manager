'use client';

import {useQuery, useMutation, useQueryClient, type QueryKey} from '@tanstack/react-query';
import {gqlRequest} from '@/lib/graphql/client';
import {
    GET_CLIENTS,
    GET_CLIENT,
    CREATE_CLIENT,
    UPDATE_CLIENT,
    DELETE_CLIENT,
    type ClientDto,
    type CreateClientInput,
    type UpdateClientInput,
} from '@/lib/graphql/operations/clients.operations';
import {clientLogger} from '@/lib/logger/client-logger';

const logger = clientLogger('use-clients-queries');

export const clientKeys = {
    all: ['clients'] as QueryKey,
    detail: (id: string) => ['clients', id] as QueryKey,
};

export function useClients(initialData?: ClientDto[]) {
    return useQuery({
        queryKey: clientKeys.all,
        queryFn: () =>
            gqlRequest<{ clients: ClientDto[] }>(GET_CLIENTS).then((r) => r.clients),
        initialData,
    });
}

export function useClient(id: string, initialData?: ClientDto) {
    return useQuery({
        queryKey: clientKeys.detail(id),
        queryFn: () =>
            gqlRequest<{ client: ClientDto }>(GET_CLIENT, {id}).then((r) => r.client),
        initialData,
        enabled: !!id,
    });
}

export function useCreateClient() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (input: CreateClientInput) =>
            gqlRequest<{ createClient: ClientDto }>(CREATE_CLIENT, {input}).then(
                (r) => r.createClient,
            ),
        onMutate: async (input) => {
            await qc.cancelQueries({queryKey: clientKeys.all});
            const prev = qc.getQueryData<ClientDto[]>(clientKeys.all);
            const optimistic: ClientDto = {
                id: `optimistic-${Date.now()}`,
                ...input,
                email: input.email ?? null,
                phone: input.phone ?? null,
                notes: input.notes ?? null,
                isActive: true,
                activeSubscriptionsCount: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            qc.setQueryData<ClientDto[]>(clientKeys.all, (old) => [...(old ?? []), optimistic]);
            return {prev};
        },
        onError: (err, _, ctx) => {
            logger.error('createClient failed', err);
            if (ctx?.prev) qc.setQueryData(clientKeys.all, ctx.prev);
        },
        onSettled: () => qc.invalidateQueries({queryKey: clientKeys.all}),
    });
}

export function useUpdateClient() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({id, input}: { id: string; input: UpdateClientInput }) =>
            gqlRequest<{ updateClient: ClientDto }>(UPDATE_CLIENT, {id, input}).then(
                (r) => r.updateClient,
            ),
        onMutate: async ({id, input}) => {
            await qc.cancelQueries({queryKey: clientKeys.all});
            const prev = qc.getQueryData<ClientDto[]>(clientKeys.all);
            qc.setQueryData<ClientDto[]>(clientKeys.all, (old) =>
                old?.map((c) => (c.id === id ? {...c, ...input} : c)) ?? [],
            );
            return {prev};
        },
        onError: (err, _, ctx) => {
            logger.error('updateClient failed', err);
            if (ctx?.prev) qc.setQueryData(clientKeys.all, ctx.prev);
        },
        onSettled: () => {
            qc.invalidateQueries({queryKey: clientKeys.all});
        },
    });
}

export function useDeleteClient() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) =>
            gqlRequest<{ deleteClient: boolean }>(DELETE_CLIENT, {id}).then((r) => r.deleteClient),
        onMutate: async (id) => {
            await qc.cancelQueries({queryKey: clientKeys.all});
            const prev = qc.getQueryData<ClientDto[]>(clientKeys.all);
            qc.setQueryData<ClientDto[]>(clientKeys.all, (old) =>
                old?.filter((c) => c.id !== id) ?? [],
            );
            return {prev};
        },
        onError: (err, _, ctx) => {
            logger.error('deleteClient failed', err);
            if (ctx?.prev) qc.setQueryData(clientKeys.all, ctx.prev);
        },
        onSettled: () => qc.invalidateQueries({queryKey: clientKeys.all}),
    });
}
