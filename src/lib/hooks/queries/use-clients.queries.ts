'use client';

import {type QueryKey, useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {gqlRequest} from '@/lib/graphql/client';
import {
    type ClientDto,
    CREATE_CLIENT,
    type CreateClientInput,
    DELETE_CLIENT,
    GET_CLIENT,
    GET_CLIENTS,
    UPDATE_CLIENT,
    type UpdateClientInput,
} from '@/lib/graphql/operations/clients.operations';
import {toastError, toastSuccess} from '@/lib/utils/toast';


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
            toastError(err, 'Création du client');
            if (ctx?.prev) qc.setQueryData(clientKeys.all, ctx.prev);
        },
        onSuccess: () => toastSuccess('Client créé'),
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
            toastError(err, 'Modification du client');
            if (ctx?.prev) qc.setQueryData(clientKeys.all, ctx.prev);
        },
        onSuccess: () => toastSuccess('Client mis à jour'),
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
            toastError(err, 'Suppression du client');
            if (ctx?.prev) qc.setQueryData(clientKeys.all, ctx.prev);
        },
        onSuccess: () => toastSuccess('Client supprimé'),
        onSettled: () => qc.invalidateQueries({queryKey: clientKeys.all}),
    });
}
