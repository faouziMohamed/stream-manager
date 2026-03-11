'use client';

import {
  useQuery,
  useMutation,
  useQueryClient,
  type QueryKey,
} from '@tanstack/react-query';
import { gqlRequest } from '@/lib/graphql/client';
import {
  GET_SERVICES,
  GET_SERVICE,
  CREATE_SERVICE,
  UPDATE_SERVICE,
  DELETE_SERVICE,
  type ServiceDto,
  type CreateServiceInput,
  type UpdateServiceInput,
} from '@/lib/graphql/operations/services.operations';
import {
  GET_PLANS,
  CREATE_PLAN,
  UPDATE_PLAN,
  DELETE_PLAN,
  type PlanDto,
  type CreatePlanInput,
  type UpdatePlanInput,
} from '@/lib/graphql/operations/plans.operations';
import { clientLogger } from '@/lib/logger/client-logger';

const logger = clientLogger('use-services-queries');

export const serviceKeys = {
  all: ['services'] as QueryKey,
  detail: (id: string) => ['services', id] as QueryKey,
  plans: (serviceId?: string) => ['plans', serviceId] as QueryKey,
};

// ─── Services ─────────────────────────────────────────────────────────────────

export function useServices(initialData?: ServiceDto[]) {
  return useQuery({
    queryKey: serviceKeys.all,
    queryFn: () =>
      gqlRequest<{ services: ServiceDto[] }>(GET_SERVICES).then((r) => r.services),
    initialData,
  });
}

export function useService(id: string, initialData?: ServiceDto) {
  return useQuery({
    queryKey: serviceKeys.detail(id),
    queryFn: () =>
      gqlRequest<{ service: ServiceDto }>(GET_SERVICE, { id }).then((r) => r.service),
    initialData,
    enabled: !!id,
  });
}

export function useCreateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateServiceInput) =>
      gqlRequest<{ createService: ServiceDto }>(CREATE_SERVICE, { input }).then(
        (r) => r.createService,
      ),
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: serviceKeys.all });
      const prev = qc.getQueryData<ServiceDto[]>(serviceKeys.all);
      const optimistic: ServiceDto = {
        id: `optimistic-${Date.now()}`,
        ...input,
        description: input.description ?? null,
        logoUrl: input.logoUrl ?? null,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      qc.setQueryData<ServiceDto[]>(serviceKeys.all, (old) => [
        ...(old ?? []),
        optimistic,
      ]);
      return { prev };
    },
    onError: (err, _, ctx) => {
      logger.error('createService failed', err);
      if (ctx?.prev) qc.setQueryData(serviceKeys.all, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: serviceKeys.all }),
  });
}

export function useUpdateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateServiceInput }) =>
      gqlRequest<{ updateService: ServiceDto }>(UPDATE_SERVICE, { id, input }).then(
        (r) => r.updateService,
      ),
    onMutate: async ({ id, input }) => {
      await qc.cancelQueries({ queryKey: serviceKeys.all });
      const prev = qc.getQueryData<ServiceDto[]>(serviceKeys.all);
      qc.setQueryData<ServiceDto[]>(serviceKeys.all, (old) =>
        old?.map((s) => (s.id === id ? { ...s, ...input } : s)) ?? [],
      );
      return { prev };
    },
    onError: (err, _, ctx) => {
      logger.error('updateService failed', err);
      if (ctx?.prev) qc.setQueryData(serviceKeys.all, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: serviceKeys.all }),
  });
}

export function useDeleteService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      gqlRequest<{ deleteService: boolean }>(DELETE_SERVICE, { id }).then(
        (r) => r.deleteService,
      ),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: serviceKeys.all });
      const prev = qc.getQueryData<ServiceDto[]>(serviceKeys.all);
      qc.setQueryData<ServiceDto[]>(serviceKeys.all, (old) =>
        old?.filter((s) => s.id !== id) ?? [],
      );
      return { prev };
    },
    onError: (err, _, ctx) => {
      logger.error('deleteService failed', err);
      if (ctx?.prev) qc.setQueryData(serviceKeys.all, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: serviceKeys.all }),
  });
}

// ─── Plans ─────────────────────────────────────────────────────────────────

export function usePlans(serviceId?: string, initialData?: PlanDto[]) {
  return useQuery({
    queryKey: serviceKeys.plans(serviceId),
    queryFn: () =>
      gqlRequest<{ plans: PlanDto[] }>(GET_PLANS, { serviceId }).then((r) => r.plans),
    initialData,
  });
}

export function useCreatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePlanInput) =>
      gqlRequest<{ createPlan: PlanDto }>(CREATE_PLAN, { input }).then((r) => r.createPlan),
    onSettled: () => qc.invalidateQueries({ queryKey: ['plans'] }),
  });
}

export function useUpdatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdatePlanInput }) =>
      gqlRequest<{ updatePlan: PlanDto }>(UPDATE_PLAN, { id, input }).then((r) => r.updatePlan),
    onSettled: () => qc.invalidateQueries({ queryKey: ['plans'] }),
  });
}

export function useDeletePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      gqlRequest<{ deletePlan: boolean }>(DELETE_PLAN, { id }).then((r) => r.deletePlan),
    onSettled: () => qc.invalidateQueries({ queryKey: ['plans'] }),
  });
}
