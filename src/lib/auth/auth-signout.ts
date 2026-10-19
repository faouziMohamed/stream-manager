'use client';

import { signOut as nextAuthSignOut } from 'next-auth/react';

import { logoutAction } from '@/features/auth/server/actions/logout.action';
import { clientLogger } from '@/lib/logger/client-logger';

const log = clientLogger('auth-signout');

type SignOutInput = {
  callbackUrl: string;
};

export async function signOutWithApiLogout({ callbackUrl }: SignOutInput): Promise<void> {
  try {
    await logoutAction();
  } catch (error) {
    log.error('API logout failed before NextAuth sign out', error);
  }

  await nextAuthSignOut({ callbackUrl });
}
