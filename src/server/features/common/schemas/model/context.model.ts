import type { UserModel } from '@/server/features/auth/schemas/model/auth.model';

export interface GqlContext {
  isAccountant: boolean;
  isAdmin: boolean;
  sessionId: string | null;
  user: UserModel | null;
}
