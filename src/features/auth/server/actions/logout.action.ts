'use server';

import { auth } from '@/lib/auth/auth';
import { createLogger } from '@/lib/logger';
import { logoutUseCase } from '@/server/features/auth/use-cases/logout.use-case';

const log = createLogger('auth.logout-action');

export async function logoutAction(): Promise<void> {
  const session = await auth();
  const sessionId = session?.sessionId;
  const userId = session?.user?.id;

  if (sessionId === undefined || userId === undefined) {
    log.warn('Skipping session revocation because there is no active session');
    return;
  }

  await logoutUseCase({ sessionId, userId });
}
