import { createHash } from 'node:crypto';

import { createResourceId } from '@/server/common/utils/resource-id';
import type { UserModel, UserRole } from '@/server/features/auth/schemas/model/auth.model';

export function createSessionId(): string {
  return createResourceId('ses');
}

export function createUserModel(user: {
  avatar: string | null;
  email: string;
  id: string;
  name: string;
  role: UserRole;
}): UserModel {
  return {
    avatar: user.avatar,
    email: user.email,
    id: user.id,
    name: user.name,
    role: user.role,
  };
}

export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}
