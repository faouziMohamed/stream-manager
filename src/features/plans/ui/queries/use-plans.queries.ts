'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { listPlansAction } from '@/features/plans/server/actions/list-plans.action';
import {
  createPlanAction,
  deletePlanAction,
  updatePlanAction,
} from '@/features/plans/server/actions/plans.actions';
import type { PlanFormValues } from '@/features/plans/shared/plan-form.schema';
import { useAuthRecoveredOperation } from '@/lib/auth/use-auth-recovered-operation';
import type { ListPlansQuery } from '@/lib/graphql/generated/graphql';
import { clientLogger } from '@/lib/logger/client-logger';

export const PLANS_QUERY_KEY = ['plans', 'list'] as const;

const log = clientLogger('use-plans');

export type PlansPayload = {
  items: ListPlansQuery['plans']['items'];
  total: number;
};

export function usePlans(initialData: PlansPayload) {
  const recoverOperation = useAuthRecoveredOperation();

  return useQuery({
    queryKey: PLANS_QUERY_KEY,
    queryFn: async (): Promise<PlansPayload> => {
      const data = await recoverOperation(() => listPlansAction());
      return { items: data.items, total: data.total };
    },
    initialData,
  });
}

export function useCreatePlan() {
  const recoverOperation = useAuthRecoveredOperation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: PlanFormValues) => recoverOperation(() => createPlanAction(values)),

    onMutate: async (values) => {
      await queryClient.cancelQueries({ queryKey: PLANS_QUERY_KEY });
      const snapshot = queryClient.getQueryData<PlansPayload>(PLANS_QUERY_KEY);

      queryClient.setQueryData<PlansPayload>(PLANS_QUERY_KEY, (previous) => {
        if (previous === undefined) return previous;
        return {
          items: [
            {
              id: `optimistic-${Date.now()}`,
              name: values.name,
              durationMonths: values.durationMonths,
              price: values.price,
              currencyCode: values.currencyCode,
              planType: values.planType,
              descriptionContent: values.description ?? null,
              serviceId: values.serviceId,
              isActive: values.isActive,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            ...previous.items,
          ],
          total: previous.total + 1,
        };
      });

      return { snapshot };
    },

    onError: (_error, _values, context) => {
      log.error('Create plan failed, rolling back');
      if (context?.snapshot !== undefined) {
        queryClient.setQueryData(PLANS_QUERY_KEY, context.snapshot);
      }
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: PLANS_QUERY_KEY });
    },
  });
}

export function useUpdatePlan() {
  const recoverOperation = useAuthRecoveredOperation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: PlanFormValues }) =>
      recoverOperation(() => updatePlanAction({ id, values })),

    onMutate: async ({ id, values }) => {
      await queryClient.cancelQueries({ queryKey: PLANS_QUERY_KEY });
      const snapshot = queryClient.getQueryData<PlansPayload>(PLANS_QUERY_KEY);

      queryClient.setQueryData<PlansPayload>(PLANS_QUERY_KEY, (previous) => {
        if (previous === undefined) return previous;
        return {
          ...previous,
          items: previous.items.map((plan) =>
            plan.id === id
              ? {
                  ...plan,
                  name: values.name,
                  durationMonths: values.durationMonths,
                  price: values.price,
                  currencyCode: values.currencyCode,
                  planType: values.planType,
                  serviceId: values.serviceId,
                  isActive: values.isActive,
                }
              : plan
          ),
        };
      });

      return { snapshot };
    },

    onError: (_error, _values, context) => {
      log.error('Update plan failed, rolling back');
      if (context?.snapshot !== undefined) {
        queryClient.setQueryData(PLANS_QUERY_KEY, context.snapshot);
      }
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: PLANS_QUERY_KEY });
    },
  });
}

export function useDeletePlan() {
  const recoverOperation = useAuthRecoveredOperation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => recoverOperation(() => deletePlanAction(id)),

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: PLANS_QUERY_KEY });
      const snapshot = queryClient.getQueryData<PlansPayload>(PLANS_QUERY_KEY);

      queryClient.setQueryData<PlansPayload>(PLANS_QUERY_KEY, (previous) => {
        if (previous === undefined) return previous;
        return {
          items: previous.items.filter((plan) => plan.id !== id),
          total: Math.max(previous.total - 1, 0),
        };
      });

      return { snapshot };
    },

    onError: (_error, _id, context) => {
      log.error('Delete plan failed, rolling back');
      if (context?.snapshot !== undefined) {
        queryClient.setQueryData(PLANS_QUERY_KEY, context.snapshot);
      }
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: PLANS_QUERY_KEY });
    },
  });
}
