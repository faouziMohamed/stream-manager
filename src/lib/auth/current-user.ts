import 'server-only';

import { cache } from 'react';

import { createGraphQLContext } from '@/server/lib/graphql/context';

/**
 * The signed-in operator as the database has them right now.
 *
 * Auth.js keeps the role in the JWT, which is a snapshot from sign-in. The
 * GraphQL context already re-reads `auth_users` on every request to decide
 * access, so the UI uses the same answer: a promotion or demotion takes effect
 * on the next render without signing out and in. `cache()` keeps the layout
 * and the page in one request from reading the row twice.
 */
export const getCurrentConsoleUser = cache(async () => {
  const context = await createGraphQLContext();

  return context.user;
});

export async function isCurrentUserAdmin(): Promise<boolean> {
  const user = await getCurrentConsoleUser();

  return user?.role === 'admin';
}
