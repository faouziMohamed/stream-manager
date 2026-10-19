'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

import { useSession } from '@/lib/auth/auth-client';

/**
 * Re-reads the role from the database when the operator comes back to the tab.
 *
 * A role can change in another session while this page stays open. The server
 * renders from the live user row, but nothing asks it to until a navigation
 * happens. On focus, `update({})` runs the Auth.js `jwt` callback — which reads
 * `auth_users` and re-issues the token — and only a changed role refreshes the
 * route, so the controls follow without a sign-out, a reload or a reconnection.
 */
export function SessionRoleSync() {
  const { data, update } = useSession();
  const router = useRouter();
  const knownRole = useRef<string | undefined>(undefined);

  useEffect(() => {
    knownRole.current = data?.user?.role;
  }, [data?.user?.role]);

  useEffect(() => {
    let cancelled = false;

    async function sync() {
      const previous = knownRole.current;
      const next = await update({}).catch(() => null);
      const role = next?.user?.role;

      if (!cancelled && previous !== undefined && role !== previous) {
        router.refresh();
      }

      knownRole.current = role;
    }

    function onFocus() {
      void sync();
    }

    function onVisibilityChange() {
      if (document.visibilityState === 'visible') void sync();
    }

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      cancelled = true;
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [router, update]);

  return null;
}
