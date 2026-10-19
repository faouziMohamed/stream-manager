'use client';

// Auth uses a single long-lived (30d) session with no client-side token
// refresh, so there is nothing to "recover" — a lapsed/revoked session simply
// signs the user out on the next request. This hook stays as a thin pass-through
// so feature query hooks keep a stable call shape.
function runOperation<T>(operation: () => Promise<T>): Promise<T> {
  return operation();
}

export function useAuthRecoveredOperation(): <T>(operation: () => Promise<T>) => Promise<T> {
  return runOperation;
}
