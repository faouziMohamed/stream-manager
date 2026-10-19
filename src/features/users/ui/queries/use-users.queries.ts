import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { deleteUserAction } from '@/features/users/server/actions/delete-user.action';
import { listUsersAction } from '@/features/users/server/actions/list-users.action';
import { logoutUserDevicesAction } from '@/features/users/server/actions/logout-user-devices.action';
import { updateUserRoleAction } from '@/features/users/server/actions/update-user-role.action';
import type { UserRole } from '@/features/users/shared/user.types';
import { useAuthRecoveredOperation } from '@/lib/auth/use-auth-recovered-operation';
import type { UserManagementDto } from '@/lib/graphql/generated/graphql.users';
import { clientLogger } from '@/lib/logger/client-logger';

export const USERS_QUERY_KEY = ['users', 'list'] as const;

const log = clientLogger('use-users');

export function useUsers(initialData: UserManagementDto[]) {
  const recoverOperation = useAuthRecoveredOperation();

  return useQuery({
    queryKey: USERS_QUERY_KEY,
    queryFn: () => recoverOperation(() => listUsersAction()),
    initialData,
  });
}

export function useUpdateUserRole() {
  const recoverOperation = useAuthRecoveredOperation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { id: string; role: UserRole }) =>
      recoverOperation(() => updateUserRoleAction(input)),

    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: USERS_QUERY_KEY });
      const snapshot = queryClient.getQueryData<UserManagementDto[]>(USERS_QUERY_KEY);

      queryClient.setQueryData<UserManagementDto[]>(USERS_QUERY_KEY, (prev) => {
        if (prev === undefined) return prev;
        return prev.map((user) => (user.id === input.id ? { ...user, role: input.role } : user));
      });

      return { snapshot };
    },

    onError: (_error, _input, context) => {
      log.error('Update user role failed, rolling back');
      if (context?.snapshot !== undefined) {
        queryClient.setQueryData(USERS_QUERY_KEY, context.snapshot);
      }
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
  });
}

export function useLogoutUserDevices() {
  const recoverOperation = useAuthRecoveredOperation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => recoverOperation(() => logoutUserDevicesAction(userId)),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: USERS_QUERY_KEY });
      return { snapshot: queryClient.getQueryData<UserManagementDto[]>(USERS_QUERY_KEY) };
    },
    onError: (_error, _userId, context) => {
      log.error('Logout user devices failed, rolling back');
      if (context?.snapshot !== undefined) {
        queryClient.setQueryData(USERS_QUERY_KEY, context.snapshot);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
  });
}

export function useDeleteUser() {
  const recoverOperation = useAuthRecoveredOperation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => recoverOperation(() => deleteUserAction(userId)),

    onMutate: async (userId) => {
      await queryClient.cancelQueries({ queryKey: USERS_QUERY_KEY });
      const snapshot = queryClient.getQueryData<UserManagementDto[]>(USERS_QUERY_KEY);

      queryClient.setQueryData<UserManagementDto[]>(USERS_QUERY_KEY, (prev) => {
        if (prev === undefined) return prev;
        return prev.filter((user) => user.id !== userId);
      });

      return { snapshot };
    },

    onError: (_error, _userId, context) => {
      log.error('Delete user failed, rolling back');
      if (context?.snapshot !== undefined) {
        queryClient.setQueryData(USERS_QUERY_KEY, context.snapshot);
      }
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
  });
}
