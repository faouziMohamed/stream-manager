'use client';

import { useQuery } from '@tanstack/react-query';

import { listTimelineAction } from '@/features/timeline/server/actions/timeline.action';
import { useAuthRecoveredOperation } from '@/lib/auth/use-auth-recovered-operation';
import type { MembershipTimelineQuery } from '@/lib/graphql/generated/graphql';

export const TIMELINE_QUERY_KEY = ['timeline', 'list'] as const;

export type TimelinePayload = {
  items: MembershipTimelineQuery['membershipTimeline'];
};

export function useTimeline(initialData: TimelinePayload) {
  const recoverOperation = useAuthRecoveredOperation();

  return useQuery({
    queryKey: TIMELINE_QUERY_KEY,
    queryFn: async () => ({ items: await recoverOperation(() => listTimelineAction()) }),
    initialData,
  });
}
