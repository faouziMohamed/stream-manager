"use client";

import {
  type QueryKey,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { gqlRequest } from "@/lib/graphql/client";
import {
  CREATE_SERVICE,
  type CreateServiceInput,
  DELETE_SERVICE,
  GET_DELETED_SERVICES,
  GET_SERVICE,
  GET_SERVICES,
  RESTORE_SERVICE,
  type ServiceDto,
  UPDATE_SERVICE,
  type UpdateServiceInput,
} from "@/lib/graphql/operations/services.operations";
import {
  CREATE_PLAN,
  type CreatePlanInput,
  DELETE_PLAN,
  GET_PLANS,
  type PlanDto,
  UPDATE_PLAN,
  type UpdatePlanInput,
} from "@/lib/graphql/operations/plans.operations";
import { toastError, toastSuccess } from "@/lib/utils/toast";

export const serviceKeys = {
  all: ["services"] as QueryKey,
  deleted: ["services", "deleted"] as QueryKey,
  detail: (id: string) => ["services", id] as QueryKey,
  plans: (serviceId?: string) => ["plans", serviceId] as QueryKey,
};

// ─── Services ─────────────────────────────────────────────────────────────────

export function useServices(initialData?: ServiceDto[]) {
  return useQuery({
    queryKey: serviceKeys.all,
    queryFn: () =>
      gqlRequest<{ services: ServiceDto[] }>(GET_SERVICES).then(
        (r) => r.services,
      ),
    initialData,
  });
}

export function useService(id: string, initialData?: ServiceDto) {
  return useQuery({
    queryKey: serviceKeys.detail(id),
    queryFn: () =>
      gqlRequest<{ service: ServiceDto }>(GET_SERVICE, { id }).then(
        (r) => r.service,
      ),
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
        showOnHomepage: input.showOnHomepage ?? true,
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
      toastError(err, "Création du service");
      if (ctx?.prev) qc.setQueryData(serviceKeys.all, ctx.prev);
    },
    onSuccess: () => toastSuccess("Service créé"),
    onSettled: () => qc.invalidateQueries({ queryKey: serviceKeys.all }),
  });
}

export function useUpdateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateServiceInput }) =>
      gqlRequest<{ updateService: ServiceDto }>(UPDATE_SERVICE, {
        id,
        input,
      }).then((r) => r.updateService),
    onMutate: async ({ id, input }) => {
      await qc.cancelQueries({ queryKey: serviceKeys.all });
      const prev = qc.getQueryData<ServiceDto[]>(serviceKeys.all);
      qc.setQueryData<ServiceDto[]>(
        serviceKeys.all,
        (old) => old?.map((s) => (s.id === id ? { ...s, ...input } : s)) ?? [],
      );
      return { prev };
    },
    onError: (err, _, ctx) => {
      toastError(err, "Modification du service");
      if (ctx?.prev) qc.setQueryData(serviceKeys.all, ctx.prev);
    },
    onSuccess: () => toastSuccess("Service mis à jour"),
    onSettled: () => qc.invalidateQueries({ queryKey: serviceKeys.all }),
  });
}

export function useDeletedServices(initialData?: ServiceDto[]) {
  return useQuery({
    queryKey: serviceKeys.deleted,
    queryFn: () =>
      gqlRequest<{ deletedServices: ServiceDto[] }>(GET_DELETED_SERVICES).then(
        (r) => r.deletedServices,
      ),
    initialData,
  });
}

export function useDeleteService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, force }: { id: string; force?: boolean }) =>
      gqlRequest<{ deleteService: boolean }>(DELETE_SERVICE, {
        id,
        force,
      }).then((r) => r.deleteService),
    onMutate: async ({ id }) => {
      await qc.cancelQueries({ queryKey: serviceKeys.all });
      const prev = qc.getQueryData<ServiceDto[]>(serviceKeys.all);
      qc.setQueryData<ServiceDto[]>(
        serviceKeys.all,
        (old) => old?.filter((s) => s.id !== id) ?? [],
      );
      return { prev };
    },
    onError: (err, _, ctx) => {
      toastError(err, "Suppression du service");
      if (ctx?.prev) qc.setQueryData(serviceKeys.all, ctx.prev);
    },
    onSuccess: (_, { force }) =>
      toastSuccess(
        force ? "Service définitivement supprimé" : "Service archivé",
      ),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: serviceKeys.all });
      void qc.invalidateQueries({ queryKey: serviceKeys.deleted });
    },
  });
}

export function useRestoreService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      gqlRequest<{ restoreService: ServiceDto }>(RESTORE_SERVICE, { id }).then(
        (r) => r.restoreService,
      ),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: serviceKeys.deleted });
      const prev = qc.getQueryData<ServiceDto[]>(serviceKeys.deleted);
      qc.setQueryData<ServiceDto[]>(
        serviceKeys.deleted,
        (old) => old?.filter((s) => s.id !== id) ?? [],
      );
      return { prev };
    },
    onError: (err, _, ctx) => {
      toastError(err, "Restauration du service");
      if (ctx?.prev) qc.setQueryData(serviceKeys.deleted, ctx.prev);
    },
    onSuccess: () => toastSuccess("Service restauré"),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: serviceKeys.all });
      void qc.invalidateQueries({ queryKey: serviceKeys.deleted });
    },
  });
}

// ─── Plans ─────────────────────────────────────────────────────────────────

export function usePlans(serviceId?: string, initialData?: PlanDto[]) {
  return useQuery({
    queryKey: serviceKeys.plans(serviceId),
    queryFn: () =>
      gqlRequest<{ plans: PlanDto[] }>(GET_PLANS, { serviceId }).then(
        (r) => r.plans,
      ),
    initialData,
  });
}

export function useCreatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePlanInput) =>
      gqlRequest<{ createPlan: PlanDto }>(CREATE_PLAN, { input }).then(
        (r) => r.createPlan,
      ),
    onSuccess: () => toastSuccess("Formule créée"),
    onError: (err) => toastError(err, "Création de la formule"),
    onSettled: () => qc.invalidateQueries({ queryKey: ["plans"] }),
  });
}

export function useUpdatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdatePlanInput }) =>
      gqlRequest<{ updatePlan: PlanDto }>(UPDATE_PLAN, { id, input }).then(
        (r) => r.updatePlan,
      ),
    onSuccess: () => toastSuccess("Formule mise à jour"),
    onError: (err) => toastError(err, "Modification de la formule"),
    onSettled: () => qc.invalidateQueries({ queryKey: ["plans"] }),
  });
}

export function useDeletePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      gqlRequest<{ deletePlan: boolean }>(DELETE_PLAN, { id }).then(
        (r) => r.deletePlan,
      ),
    onSuccess: () => toastSuccess("Formule supprimée"),
    onError: (err) => toastError(err, "Suppression de la formule"),
    onSettled: () => qc.invalidateQueries({ queryKey: ["plans"] }),
  });
}
