'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { listServicesAction } from '@/features/services/server/actions/list-services.action';
import {
  createServiceAction,
  updateServiceAction,
} from '@/features/services/server/actions/manage-service.action';
import {
  archiveServiceAction,
  restoreServiceAction,
} from '@/features/services/server/actions/toggle-service-state.action';
import type { ServiceFormValues } from '@/features/services/shared/service-form.schema';
import { useAuthRecoveredOperation } from '@/lib/auth/use-auth-recovered-operation';
import type { ListServicesQuery } from '@/lib/graphql/generated/graphql';
import { clientLogger } from '@/lib/logger/client-logger';

export const SERVICES_QUERY_KEY = ['services', 'list'] as const;

const log = clientLogger('use-services');

export type ServicesListPayload = {
  items: ListServicesQuery['services']['items'];
  total: number;
};

export function useServices(initialData: ServicesListPayload) {
  const recoverOperation = useAuthRecoveredOperation();

  return useQuery({
    queryKey: SERVICES_QUERY_KEY,
    queryFn: () => recoverOperation(() => listServicesAction()),
    initialData,
  });
}

export function useArchiveService() {
  const recoverOperation = useAuthRecoveredOperation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => recoverOperation(() => archiveServiceAction(id)),

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: SERVICES_QUERY_KEY });
      const snapshot = queryClient.getQueryData<ServicesListPayload>(SERVICES_QUERY_KEY);

      queryClient.setQueryData<ServicesListPayload>(SERVICES_QUERY_KEY, (prev) => {
        if (prev === undefined) return prev;
        return {
          ...prev,
          items: prev.items.map((service) =>
            service.id === id ? { ...service, isActive: false } : service
          ),
        };
      });

      return { snapshot };
    },

    onError: (_error, _id, context) => {
      log.error('Archive service failed, rolling back');
      if (context?.snapshot !== undefined) {
        queryClient.setQueryData(SERVICES_QUERY_KEY, context.snapshot);
      }
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: SERVICES_QUERY_KEY });
    },
  });
}

export function useCreateService() {
  const recoverOperation = useAuthRecoveredOperation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: ServiceFormValues) => recoverOperation(() => createServiceAction(values)),
    onMutate: async (values) => {
      await queryClient.cancelQueries({ queryKey: SERVICES_QUERY_KEY });
      const snapshot = queryClient.getQueryData<ServicesListPayload>(SERVICES_QUERY_KEY);
      queryClient.setQueryData<ServicesListPayload>(SERVICES_QUERY_KEY, (previous) => {
        if (previous === undefined) return previous;
        return {
          items: [
            {
              category: values.category,
              createdAt: new Date().toISOString(),
              descriptionContent: values.description ?? null,
              id: `optimistic-${Date.now()}`,
              imageKey: values.imageKey ?? null,
              imageUrl: values.imageUrl ?? null,
              isActive: true,
              name: values.name,
              supportsProfiles: values.supportsProfiles,
            },
            ...previous.items,
          ],
          total: previous.total + 1,
        };
      });
      return { snapshot };
    },
    onError: (_error, _values, context) => rollback(queryClient, context?.snapshot, 'Create'),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: SERVICES_QUERY_KEY });
    },
  });
}

export function useRestoreService() {
  const recoverOperation = useAuthRecoveredOperation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => recoverOperation(() => restoreServiceAction(id)),

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: SERVICES_QUERY_KEY });
      const snapshot = queryClient.getQueryData<ServicesListPayload>(SERVICES_QUERY_KEY);

      queryClient.setQueryData<ServicesListPayload>(SERVICES_QUERY_KEY, (prev) => {
        if (prev === undefined) return prev;
        return {
          ...prev,
          items: prev.items.map((service) =>
            service.id === id ? { ...service, isActive: true } : service
          ),
        };
      });

      return { snapshot };
    },

    onError: (_error, _id, context) => {
      log.error('Restore service failed, rolling back');
      if (context?.snapshot !== undefined) {
        queryClient.setQueryData(SERVICES_QUERY_KEY, context.snapshot);
      }
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: SERVICES_QUERY_KEY });
    },
  });
}

export function useUpdateService() {
  const recoverOperation = useAuthRecoveredOperation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: ServiceFormValues }) =>
      recoverOperation(() => updateServiceAction({ id, ...values })),
    onMutate: async ({ id, values }) => {
      await queryClient.cancelQueries({ queryKey: SERVICES_QUERY_KEY });
      const snapshot = queryClient.getQueryData<ServicesListPayload>(SERVICES_QUERY_KEY);
      queryClient.setQueryData<ServicesListPayload>(SERVICES_QUERY_KEY, (previous) => {
        if (previous === undefined) return previous;
        return {
          ...previous,
          items: previous.items.map((service) =>
            service.id === id ? { ...service, ...values } : service
          ),
        };
      });
      return { snapshot };
    },
    onError: (_error, _values, context) => rollback(queryClient, context?.snapshot, 'Update'),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: SERVICES_QUERY_KEY });
    },
  });
}

function rollback(
  queryClient: ReturnType<typeof useQueryClient>,
  snapshot: ServicesListPayload | undefined,
  operation: string
) {
  log.error(`${operation} service failed, rolling back`);
  if (snapshot !== undefined) queryClient.setQueryData(SERVICES_QUERY_KEY, snapshot);
}
