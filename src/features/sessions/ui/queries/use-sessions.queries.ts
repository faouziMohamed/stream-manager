'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { listSessionsAction } from '@/features/sessions/server/actions/list-sessions.action';
import { revokeSessionAction } from '@/features/sessions/server/actions/revoke-session.action';
import type { SessionItem } from '@/features/sessions/shared/session.types';
import { useAuthRecoveredOperation } from '@/lib/auth/use-auth-recovered-operation';
import { clientLogger } from '@/lib/logger/client-logger';

export const SESSIONS_QUERY_KEY = ['sessions', 'list'] as const;

const log = clientLogger('use-sessions');

export function useSessions(initialData?: SessionItem[]) {
  const recoverOperation = useAuthRecoveredOperation();

  return useQuery({
    queryKey: SESSIONS_QUERY_KEY,
    queryFn: () => recoverOperation(() => listSessionsAction()),
    initialData,
  });
}

export function useRevokeSession() {
  const recoverOperation = useAuthRecoveredOperation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => recoverOperation(() => revokeSessionAction(id)),
    onError: () => {
      log.error('Revoke session failed');
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: SESSIONS_QUERY_KEY });
    },
  });
}
