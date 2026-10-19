'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useTransition } from 'react';

/**
 * Keeps a view selection in the URL, so a reload, a back step or a pasted
 * link lands on the same view.
 *
 * `router.replace`, not raw `history.replaceState`: `replaceState` writes the
 * address bar directly and bypasses Next's router state, so any later server
 * re-render runs against the URL the router still believes is current. That
 * failure mode is subtle and only clears on a hard reload — the pattern here
 * follows the atlas-dashboard calendar, which already paid for that lesson.
 *
 * The search params are read as the source of truth rather than mirrored into
 * state, so there is no second copy to fall out of sync and no effect
 * resyncing one to the other.
 */
export function useUrlTab(paramName: string, allowed: readonly string[], fallback: string) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const fromUrl = searchParams.get(paramName);
  const value = fromUrl !== null && allowed.includes(fromUrl) ? fromUrl : fallback;

  const select = useCallback(
    (next: string) => {
      // Built from the router's search params, not `window.location`: one
      // source of truth, and no browser API in a framework that already owns
      // the URL. Other writers' params on the page survive; this writer only
      // touches its own key.
      const params = new URLSearchParams(searchParams.toString());

      if (next === fallback) {
        params.delete(paramName);
      } else {
        params.set(paramName, next);
      }

      const query = params.toString();

      // Selecting the value already in the URL is not a navigation. Replacing
      // with an identical URL re-renders the server tree for nothing, and a
      // control that reports its current value while mounting would do it on
      // every render — an endless reload.
      if (query === searchParams.toString()) return;

      startTransition(() => {
        router.replace(pathname + (query === '' ? '' : `?${query}`), { scroll: false });
      });
    },
    [fallback, paramName, pathname, router, searchParams]
  );

  return [value, select, isPending] as const;
}
