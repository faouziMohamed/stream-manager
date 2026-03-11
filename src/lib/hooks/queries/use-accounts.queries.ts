'use client';

import {type QueryKey, useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {gqlRequest} from '@/lib/graphql/client';
import {
    ASSIGN_PROFILE,
    type AssignProfileInput,
    CREATE_ACCOUNT,
    CREATE_PROFILE,
    type CreateAccountInput,
    type CreateProfileInput,
    DELETE_ACCOUNT,
    DELETE_PROFILE,
    GET_STREAMING_ACCOUNTS,
    REMOVE_ASSIGNMENT,
    type StreamingAccountDto,
    type SubscriptionAssignmentDto,
    UPDATE_ACCOUNT,
    UPDATE_PROFILE,
    type UpdateAccountInput,
    type UpdateProfileInput,
} from '@/lib/graphql/operations/accounts.operations';
import {toastError, toastSuccess} from '@/lib/utils/toast';


export const accountKeys = {
    all: ['streamingAccounts'] as QueryKey,
    byService: (serviceId: string) => ['streamingAccounts', serviceId] as QueryKey,
};

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useStreamingAccounts(serviceId?: string, initialData?: StreamingAccountDto[]) {
    return useQuery({
        queryKey: serviceId ? accountKeys.byService(serviceId) : accountKeys.all,
        queryFn: () =>
            gqlRequest<{ streamingAccounts: StreamingAccountDto[] }>(
                GET_STREAMING_ACCOUNTS,
                serviceId ? {serviceId} : {},
            ).then((r) => r.streamingAccounts),
        initialData,
    });
}

// ─── Account mutations ────────────────────────────────────────────────────────

export function useCreateAccount() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (input: CreateAccountInput) =>
            gqlRequest<{ createAccount: StreamingAccountDto }>(CREATE_ACCOUNT, {input}).then(
                (r) => r.createAccount,
            ),
        onSuccess: () => toastSuccess('Compte créé'),
        onError: (err) => toastError(err, 'Création du compte'),
        onSettled: () => qc.invalidateQueries({queryKey: accountKeys.all}),
    });
}

export function useUpdateAccount() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({id, input}: { id: string; input: UpdateAccountInput }) =>
            gqlRequest<{ updateAccount: StreamingAccountDto }>(UPDATE_ACCOUNT, {id, input}).then(
                (r) => r.updateAccount,
            ),
        onMutate: async ({id, input}) => {
            await qc.cancelQueries({queryKey: accountKeys.all});
            const prev = qc.getQueryData<StreamingAccountDto[]>(accountKeys.all);
            qc.setQueryData<StreamingAccountDto[]>(accountKeys.all, (old) =>
                old?.map((a) => (a.id === id ? {...a, ...input} : a)) ?? [],
            );
            return {prev};
        },
        onError: (err, _, ctx) => {
            toastError(err, 'Modification du compte');
            if (ctx?.prev) qc.setQueryData(accountKeys.all, ctx.prev);
        },
        onSuccess: () => toastSuccess('Compte mis à jour'),
        onSettled: () => qc.invalidateQueries({queryKey: accountKeys.all}),
    });
}

export function useDeleteAccount() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) =>
            gqlRequest<{ deleteAccount: boolean }>(DELETE_ACCOUNT, {id}).then(
                (r) => r.deleteAccount,
            ),
        onMutate: async (id) => {
            await qc.cancelQueries({queryKey: accountKeys.all});
            const prev = qc.getQueryData<StreamingAccountDto[]>(accountKeys.all);
            qc.setQueryData<StreamingAccountDto[]>(accountKeys.all, (old) =>
                old?.filter((a) => a.id !== id) ?? [],
            );
            return {prev};
        },
        onError: (err, _, ctx) => {
            toastError(err, 'Suppression du compte');
            if (ctx?.prev) qc.setQueryData(accountKeys.all, ctx.prev);
        },
        onSuccess: () => toastSuccess('Compte supprimé'),
        onSettled: () => qc.invalidateQueries({queryKey: accountKeys.all}),
    });
}

// ─── Profile mutations ────────────────────────────────────────────────────────

export function useCreateProfile() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (input: CreateProfileInput) =>
            gqlRequest(CREATE_PROFILE, {input}),
        onSuccess: () => toastSuccess('Profil créé'),
        onError: (err) => toastError(err, 'Création du profil'),
        onSettled: () => qc.invalidateQueries({queryKey: accountKeys.all}),
    });
}

export function useUpdateProfile() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({id, input}: { id: string; input: UpdateProfileInput }) =>
            gqlRequest(UPDATE_PROFILE, {id, input}),
        onSuccess: () => toastSuccess('Profil mis à jour'),
        onError: (err) => toastError(err, 'Modification du profil'),
        onSettled: () => qc.invalidateQueries({queryKey: accountKeys.all}),
    });
}

export function useDeleteProfile() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => gqlRequest(DELETE_PROFILE, {id}),
        onSuccess: () => toastSuccess('Profil supprimé'),
        onError: (err) => toastError(err, 'Suppression du profil'),
        onSettled: () => qc.invalidateQueries({queryKey: accountKeys.all}),
    });
}

// ─── Assignment mutations ─────────────────────────────────────────────────────

export function useAssignProfile() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (input: AssignProfileInput) =>
            gqlRequest<{ assignProfile: SubscriptionAssignmentDto }>(ASSIGN_PROFILE, {input}).then(
                (r) => r.assignProfile,
            ),
        onSuccess: () => toastSuccess('Profil assigné'),
        onError: (err) => toastError(err, 'Assignation du profil'),
        onSettled: () => qc.invalidateQueries({queryKey: accountKeys.all}),
    });
}

export function useRemoveAssignment() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (subscriptionId: string) =>
            gqlRequest(REMOVE_ASSIGNMENT, {subscriptionId}),
        onSuccess: () => toastSuccess('Assignation retirée'),
        onError: (err) => toastError(err, 'Retrait de l\'assignation'),
        onSettled: () => qc.invalidateQueries({queryKey: accountKeys.all}),
    });
}
