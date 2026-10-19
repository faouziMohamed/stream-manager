import { auth } from '@/lib/auth/auth';
import { gqlRequest } from '@/lib/graphql/client';
import {
  MembershipTimelineDocument,
  type MembershipTimelineQuery,
  type MembershipTimelineQueryVariables,
} from '@/lib/graphql/generated/graphql';
import { createLogger } from '@/lib/logger';

const log = createLogger('timeline.loader');

type TimelineItem = MembershipTimelineQuery['membershipTimeline'][number];

export async function loadTimeline(): Promise<TimelineItem[]> {
  try {
    const session = await auth();

    if (session === null || session.user?.id === undefined) {
      log.warn('No session or access token when loading membership timeline');
      return [];
    }

    const data = await gqlRequest<MembershipTimelineQuery, MembershipTimelineQueryVariables>(
      MembershipTimelineDocument,
      {}
    );

    return data.membershipTimeline;
  } catch (error) {
    log.error(
      { error: error instanceof Error ? error.message : String(error) },
      'Failed to load membership timeline'
    );
    return [];
  }
}
