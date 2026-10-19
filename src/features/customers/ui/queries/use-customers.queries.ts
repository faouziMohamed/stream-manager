'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createCustomerAction } from '@/features/customers/server/actions/create-customer.action';
import { updateCustomerAction } from '@/features/customers/server/actions/update-customer.action';
import { archiveCustomerAction } from '@/features/customers/server/actions/archive-customer.action';
import { listCustomersAction } from '@/features/customers/server/actions/list-customers.action';
import type {
  CustomerConnection,
  CustomerListItem,
} from '@/features/customers/shared/customer.types';
import type { CustomerFormValues } from '@/features/customers/shared/customer.schema';
import { useAuthRecoveredOperation } from '@/lib/auth/use-auth-recovered-operation';
import { clientLogger } from '@/lib/logger/client-logger';

export const CUSTOMERS_QUERY_KEY = ['customers', 'list'] as const;

const log = clientLogger('use-customers');

export function useCustomers(initialData?: CustomerConnection) {
  const recoverOperation = useAuthRecoveredOperation();

  return useQuery({
    queryKey: CUSTOMERS_QUERY_KEY,
    queryFn: () => recoverOperation(() => listCustomersAction()),
    initialData,
  });
}

export function useCreateCustomer() {
  const recoverOperation = useAuthRecoveredOperation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: CustomerFormValues) =>
      recoverOperation(() => createCustomerAction(values)),

    onMutate: async (values) => {
      await queryClient.cancelQueries({ queryKey: CUSTOMERS_QUERY_KEY });
      const snapshot = queryClient.getQueryData<CustomerConnection>(CUSTOMERS_QUERY_KEY);

      const optimistic: CustomerListItem = {
        id: `optimistic-${Date.now()}`,
        businessId: 'CST-…',
        name: values.name,
        email: values.email ?? null,
        phone: values.phone ?? null,
        isActive: true,
        language: values.language,
        notesContent: values.notes ?? null,
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData<CustomerConnection>(CUSTOMERS_QUERY_KEY, (prev) => {
        if (prev === undefined) return prev;
        return {
          ...prev,
          items: [optimistic, ...prev.items],
          pageInfo: { ...prev.pageInfo, total: prev.pageInfo.total + 1 },
        };
      });

      return { snapshot };
    },

    onError: (error, _values, context) => {
      log.error('Create customer failed, rolling back');
      if (context?.snapshot !== undefined) {
        queryClient.setQueryData(CUSTOMERS_QUERY_KEY, context.snapshot);
      }
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: CUSTOMERS_QUERY_KEY });
    },
  });
}

export function useUpdateCustomer() {
  const recoverOperation = useAuthRecoveredOperation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: CustomerFormValues }) =>
      recoverOperation(() => updateCustomerAction(id, values)),

    onMutate: async ({ id, values }) => {
      await queryClient.cancelQueries({ queryKey: CUSTOMERS_QUERY_KEY });
      const snapshot = queryClient.getQueryData<CustomerConnection>(CUSTOMERS_QUERY_KEY);

      queryClient.setQueryData<CustomerConnection>(CUSTOMERS_QUERY_KEY, (prev) => {
        if (prev === undefined) return prev;
        return {
          ...prev,
          items: prev.items.map((c) =>
            c.id === id
              ? {
                  ...c,
                  name: values.name,
                  email: values.email ?? null,
                  phone: values.phone ?? null,
                }
              : c
          ),
        };
      });

      return { snapshot };
    },

    onError: (_error, _vars, context) => {
      log.error('Update customer failed, rolling back');
      if (context?.snapshot !== undefined) {
        queryClient.setQueryData(CUSTOMERS_QUERY_KEY, context.snapshot);
      }
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: CUSTOMERS_QUERY_KEY });
    },
  });
}

export function useArchiveCustomer() {
  const recoverOperation = useAuthRecoveredOperation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => recoverOperation(() => archiveCustomerAction(id)),

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: CUSTOMERS_QUERY_KEY });
      const snapshot = queryClient.getQueryData<CustomerConnection>(CUSTOMERS_QUERY_KEY);

      queryClient.setQueryData<CustomerConnection>(CUSTOMERS_QUERY_KEY, (prev) => {
        if (prev === undefined) return prev;
        return {
          ...prev,
          items: prev.items.map((c) => (c.id === id ? { ...c, isActive: false } : c)),
        };
      });

      return { snapshot };
    },

    onError: (_error, _id, context) => {
      log.error('Archive customer failed, rolling back');
      if (context?.snapshot !== undefined) {
        queryClient.setQueryData(CUSTOMERS_QUERY_KEY, context.snapshot);
      }
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: CUSTOMERS_QUERY_KEY });
    },
  });
}
