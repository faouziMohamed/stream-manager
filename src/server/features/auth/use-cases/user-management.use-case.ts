import { AppError } from '@/server/common/errors/app-error';
import {
  listAuthUsers,
  updateAuthUserRole,
  deleteAuthUser,
} from '@/server/features/auth/repositories/auth-users-management.repository';
import { findUserById } from '@/server/features/auth/repositories/auth-users.repository';

export async function listUsersUseCase(
  dependencies: ListUsersDependencies = defaultListDependencies
) {
  const users = await dependencies.listAuthUsers();
  return users.map((user) => ({
    avatar: user.avatar,
    createdAt: user.createdAt.toISOString(),
    email: user.email,
    id: user.id,
    name: user.name,
    role: user.role,
    updatedAt: user.updatedAt.toISOString(),
  }));
}

export async function updateUserRoleUseCase(
  input: { id: string; role: 'admin' | 'accountant' | 'user' },
  dependencies: UpdateUserRoleDependencies = defaultUpdateDependencies
) {
  const user = await dependencies.findUserById(input.id);
  if (!user) {
    throw new AppError('User not found', 404, 'NOT_FOUND');
  }

  const updated = await dependencies.updateAuthUserRole(input.id, input.role);
  if (!updated) {
    throw new AppError('Failed to update user role', 500, 'INTERNAL_ERROR');
  }

  return {
    avatar: updated.avatar,
    createdAt: updated.createdAt.toISOString(),
    email: updated.email,
    id: updated.id,
    name: updated.name,
    role: updated.role,
    updatedAt: updated.updatedAt.toISOString(),
  };
}

export async function deleteUserUseCase(
  id: string,
  dependencies: DeleteUserDependencies = defaultDeleteDependencies
) {
  const user = await dependencies.findUserById(id);
  if (!user) {
    throw new AppError('User not found', 404, 'NOT_FOUND');
  }

  const deleted = await dependencies.deleteAuthUser(id);
  if (!deleted) {
    throw new AppError('Failed to delete user', 500, 'INTERNAL_ERROR');
  }

  return {
    email: deleted.email,
    id: deleted.id,
    name: deleted.name,
  };
}

interface ListUsersDependencies {
  listAuthUsers: typeof listAuthUsers;
}

interface UpdateUserRoleDependencies {
  findUserById: typeof findUserById;
  updateAuthUserRole: typeof updateAuthUserRole;
}

interface DeleteUserDependencies {
  deleteAuthUser: typeof deleteAuthUser;
  findUserById: typeof findUserById;
}

const defaultListDependencies: ListUsersDependencies = { listAuthUsers };
const defaultUpdateDependencies: UpdateUserRoleDependencies = { findUserById, updateAuthUserRole };
const defaultDeleteDependencies: DeleteUserDependencies = { deleteAuthUser, findUserById };
