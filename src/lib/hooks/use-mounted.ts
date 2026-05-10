'use client';

import { useSyncExternalStore } from 'react';

function emptySubscribe(): () => void {
  // eslint-disable-next-line no-empty-function
  return function noop() {};
}

/**
 * Returns `true` once the component has mounted on the client.
 * Safe for hydration — always returns `false` during SSR.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}
