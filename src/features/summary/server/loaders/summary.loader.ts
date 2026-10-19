import { auth } from '@/lib/auth/auth';
import { gqlRequest } from '@/lib/graphql/client';
import {
  ListSummaryLinksDocument,
  type ListSummaryLinksQuery,
  type ListSummaryLinksQueryVariables,
} from '@/lib/graphql/generated/graphql';
import { createLogger } from '@/lib/logger';

const log = createLogger('summary.loader');

type SummaryLinkListItem = ListSummaryLinksQuery['summaryLinks'][number];

type SummaryLinkListPayload = {
  items: SummaryLinkListItem[];
};

export async function loadSummaryLinks(): Promise<SummaryLinkListPayload> {
  const empty: SummaryLinkListPayload = { items: [] };

  try {
    const session = await auth();

    if (session === null || session.user?.id === undefined) {
      log.warn('No session or access token when loading summary links');
      return empty;
    }

    const data = await gqlRequest<ListSummaryLinksQuery, ListSummaryLinksQueryVariables>(
      ListSummaryLinksDocument,
      {}
    );

    return { items: data.summaryLinks };
  } catch (error) {
    log.error(
      { error: error instanceof Error ? error.message : String(error) },
      'Failed to load summary links'
    );
    return empty;
  }
}
