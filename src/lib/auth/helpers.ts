import { auth } from './auth';
import type { User } from '@/lib/db/tables/auth.table';

export type UserRole = 'admin' | 'accountant' | 'user';

/**
 * Get the current session from a Request (server-side).
 */
export async function getSession(request: Request) {
  return auth.api.getSession({ headers: request.headers });
}

/**
 * Returns true if the session user has admin role.
 */
export function isAdmin(user: User | null | undefined): boolean {
  return user?.role === 'admin';
}

/**
 * Returns true if the session user has accountant or admin role.
 */
export function isAccountant(user: User | null | undefined): boolean {
  return user?.role === 'accountant' || user?.role === 'admin';
}
