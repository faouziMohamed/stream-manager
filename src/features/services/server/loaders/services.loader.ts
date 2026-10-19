import { auth } from '@/lib/auth/auth';
import { gqlRequest } from '@/lib/graphql/client';
import { loadAllPages } from '@/lib/graphql/load-all-pages';
import {
  ListServicesDocument,
  type ListServicesQuery,
  type ListServicesQueryVariables,
  ServiceDetailDocument,
  type ServiceDetailQuery,
  type ServiceDetailQueryVariables,
} from '@/lib/graphql/generated/graphql';
import { createLogger } from '@/lib/logger';

export type ServiceDetailPayload = {
  memberships: ServiceDetailQuery['memberships']['items'];
  membershipsTotal: number;
  plans: ServiceDetailQuery['plans']['items'];
  service: NonNullable<ServiceDetailQuery['service']>;
  streamingAccounts: ServiceDetailQuery['streamingAccounts'];
};

export async function loadServiceDetail(id: string): Promise<ServiceDetailPayload | null> {
  try {
    const session = await auth();
    if (session === null || session.user?.id === undefined) {
      log.warn('No session or access token when loading service detail');
      return null;
    }

    const data = await gqlRequest<ServiceDetailQuery, ServiceDetailQueryVariables>(
      ServiceDetailDocument,
      { id }
    );

    if (data.service === null) return null;

    return {
      memberships: data.memberships.items,
      membershipsTotal: data.memberships.pageInfo.total,
      plans: data.plans.items,
      service: data.service,
      streamingAccounts: data.streamingAccounts.filter((account) => account.serviceId === id),
    };
  } catch (error) {
    log.error(
      { error: error instanceof Error ? error.message : String(error) },
      'Failed to load service detail'
    );
    return null;
  }
}

const log = createLogger('services.loader');

type ServiceListItem = ListServicesQuery['services']['items'][number];

type ServiceListPayload = {
  items: ServiceListItem[];
  total: number;
};

export async function loadServices(): Promise<ServiceListPayload> {
  const empty: ServiceListPayload = { items: [], total: 0 };

  try {
    const session = await auth();

    if (session === null || session.user?.id === undefined) {
      log.warn('No session or access token when loading services');
      return empty;
    }

    const data = await loadAllPages(async (page, pageSize) => {
      const response = await gqlRequest<ListServicesQuery, ListServicesQueryVariables>(
        ListServicesDocument,
        { page, pageSize }
      );

      return response.services;
    });

    return {
      items: data.items,
      total: data.pageInfo.total,
    };
  } catch (error) {
    log.error(
      { error: error instanceof Error ? error.message : String(error) },
      'Failed to load services'
    );
    return empty;
  }
}
