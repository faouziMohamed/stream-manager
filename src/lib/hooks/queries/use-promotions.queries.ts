'use client';

import { useQuery, useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { gqlRequest } from '@/lib/graphql/client';
import {
  GET_PROMOTIONS,
  CREATE_PROMOTION,
  UPDATE_PROMOTION,
  DELETE_PROMOTION,
  type PromotionDto,
  type CreatePromotionInput,
  type UpdatePromotionInput,
} from '@/lib/graphql/operations/promotions.operations';
import { clientLogger } from '@/lib/logger/client-logger';

const logger = clientLogger('use-promotions-queries');

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
      gqlRequest<{ createPromotion: PromotionDto }>(CREATE_PROMOTION, { input }).then(
        (r) => r.createPromotion,
      ),
    onError: (err) => logger.error('createPromotion failed', err),
    onSettled: () => qc.invalidateQueries({ queryKey: promotionKeys.all }),
  });
}

export function useUpdatePromotion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdatePromotionInput }) =>
      gqlRequest<{ updatePromotion: PromotionDto }>(UPDATE_PROMOTION, { id, input }).then(
        (r) => r.updatePromotion,
      ),
    onMutate: async ({ id, input }) => {
      await qc.cancelQueries({ queryKey: promotionKeys.all });
      const prev = qc.getQueryData<PromotionDto[]>(promotionKeys.all);
      qc.setQueryData<PromotionDto[]>(promotionKeys.all, (old) =>
        old?.map((p) => (p.id === id ? { ...p, ...input } : p)) ?? [],
      );
      return { prev };
    },
    onError: (err, _, ctx) => {
      logger.error('updatePromotion failed', err);
      if (ctx?.prev) qc.setQueryData(promotionKeys.all, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: promotionKeys.all }),
  });
}

export function useDeletePromotion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      gqlRequest<{ deletePromotion: boolean }>(DELETE_PROMOTION, { id }).then(
        (r) => r.deletePromotion,
      ),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: promotionKeys.all });
      const prev = qc.getQueryData<PromotionDto[]>(promotionKeys.all);
      qc.setQueryData<PromotionDto[]>(promotionKeys.all, (old) =>
        old?.filter((p) => p.id !== id) ?? [],
      );
      return { prev };
    },
    onError: (err, _, ctx) => {
      logger.error('deletePromotion failed', err);
      if (ctx?.prev) qc.setQueryData(promotionKeys.all, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: promotionKeys.all }),
  });
}
