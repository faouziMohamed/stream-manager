'use client';

import {type QueryKey, useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {gqlRequest} from '@/lib/graphql/client';
import {
    CREATE_PROMOTION,
    type CreatePromotionInput,
    DELETE_PROMOTION,
    GET_PROMOTIONS,
    type PromotionDto,
    UPDATE_PROMOTION,
    type UpdatePromotionInput,
} from '@/lib/graphql/operations/promotions.operations';
import {toastError, toastSuccess} from '@/lib/utils/toast';


export const promotionKeys = {
    all: ['promotions'] as QueryKey,
    detail: (id: string) => ['promotions', id] as QueryKey,
};

export function usePromotions(initialData?: PromotionDto[]) {
    return useQuery({
        queryKey: promotionKeys.all,
        queryFn: () =>
            gqlRequest<{ promotions: PromotionDto[] }>(GET_PROMOTIONS).then((r) => r.promotions),
        initialData,
    });
}

export function useCreatePromotion() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (input: CreatePromotionInput) =>
            gqlRequest<{ createPromotion: PromotionDto }>(CREATE_PROMOTION, {input}).then(
                (r) => r.createPromotion,
            ),
        onSuccess: () => toastSuccess('Promotion créée'),
        onError: (err) => toastError(err, 'Création de la promotion'),
        onSettled: () => qc.invalidateQueries({queryKey: promotionKeys.all}),
    });
}

export function useUpdatePromotion() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({id, input}: { id: string; input: UpdatePromotionInput }) =>
            gqlRequest<{ updatePromotion: PromotionDto }>(UPDATE_PROMOTION, {id, input}).then(
                (r) => r.updatePromotion,
            ),
        onMutate: async ({id, input}) => {
            await qc.cancelQueries({queryKey: promotionKeys.all});
            const prev = qc.getQueryData<PromotionDto[]>(promotionKeys.all);
            qc.setQueryData<PromotionDto[]>(promotionKeys.all, (old) =>
                old?.map((p) => (p.id === id ? {...p, ...input} : p)) ?? [],
            );
            return {prev};
        },
        onError: (err, _, ctx) => {
            toastError(err, 'Modification de la promotion');
            if (ctx?.prev) qc.setQueryData(promotionKeys.all, ctx.prev);
        },
        onSuccess: () => toastSuccess('Promotion mise à jour'),
        onSettled: () => qc.invalidateQueries({queryKey: promotionKeys.all}),
    });
}

export function useDeletePromotion() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) =>
            gqlRequest<{ deletePromotion: boolean }>(DELETE_PROMOTION, {id}).then(
                (r) => r.deletePromotion,
            ),
        onMutate: async (id) => {
            await qc.cancelQueries({queryKey: promotionKeys.all});
            const prev = qc.getQueryData<PromotionDto[]>(promotionKeys.all);
            qc.setQueryData<PromotionDto[]>(promotionKeys.all, (old) =>
                old?.filter((p) => p.id !== id) ?? [],
            );
            return {prev};
        },
        onError: (err, _, ctx) => {
            toastError(err, 'Suppression de la promotion');
            if (ctx?.prev) qc.setQueryData(promotionKeys.all, ctx.prev);
        },
        onSuccess: () => toastSuccess('Promotion supprimée'),
        onSettled: () => qc.invalidateQueries({queryKey: promotionKeys.all}),
    });
}
