import { auth } from '@/lib/auth/auth';
import { gqlRequest } from '@/lib/graphql/client';
import { loadAllPages } from '@/lib/graphql/load-all-pages';
import {
  ListPlansDocument,
  type ListPlansQuery,
  type ListPlansQueryVariables,
  ListPlanServiceOptionsDocument,
  type ListPlanServiceOptionsQuery,
  type ListPlanServiceOptionsQueryVariables,
  PlanDetailDocument,
  type PlanDetailQuery,
  type PlanDetailQueryVariables,
} from '@/lib/graphql/generated/graphql';
import { ROUTES } from '@/lib/config/routes';
import { createLogger } from '@/lib/logger';

export type PlanOwner = { href: string; id: string; name: string; type: 'service' };

export type PlanDetailPayload = {
  memberships: PlanDetailQuery['memberships']['items'];
  membershipsTotal: number;
  owner: PlanOwner | null;
  plan: NonNullable<PlanDetailQuery['plan']>;
};

const log = createLogger('plans.loader');

type PlanListItem = ListPlansQuery['plans']['items'][number];
type ServiceOption = ListPlanServiceOptionsQuery['services']['items'][number];

export type PlansLoaderPayload = {
  items: PlanListItem[];
  serviceOptions: ServiceOption[];
  total: number;
};

export async function loadPlans(): Promise<PlansLoaderPayload> {
  const empty: PlansLoaderPayload = {
    items: [],
    serviceOptions: [],
    total: 0,
  };

  try {
    const session = await auth();

    if (session === null || session.user?.id === undefined) {
      log.warn('No session or access token when loading plans');
      return empty;
    }

    const [plansData, serviceOptions] = await Promise.all([
      gqlRequest<ListPlansQuery, ListPlansQueryVariables>(ListPlansDocument, {
        page: 1,
        pageSize: 50,
        serviceId: null,
        planType: null,
        isActive: null,
      }),
      loadAllPages(async (page, pageSize) => {
        const response = await gqlRequest<
          ListPlanServiceOptionsQuery,
          ListPlanServiceOptionsQueryVariables
        >(ListPlanServiceOptionsDocument, { page, pageSize });
        return response.services;
      }),
    ]);

    return {
      items: plansData.plans.items,
      serviceOptions: serviceOptions.items,
      total: plansData.plans.pageInfo.total,
    };
  } catch (error) {
    log.error(
      { error: error instanceof Error ? error.message : String(error) },
      'Failed to load plans'
    );
    return empty;
  }
}

export async function loadPlanDetail(id: string): Promise<PlanDetailPayload | null> {
  try {
    const session = await auth();
    if (session === null || session.user?.id === undefined) {
      log.warn('No session or access token when loading plan detail');
      return null;
    }

    const data = await gqlRequest<PlanDetailQuery, PlanDetailQueryVariables>(PlanDetailDocument, {
      id,
    });

    if (data.plan === null) return null;

    return {
      memberships: data.memberships.items,
      membershipsTotal: data.memberships.pageInfo.total,
      owner: resolvePlanOwner(data),
      plan: data.plan,
    };
  } catch (error) {
    log.error(
      { error: error instanceof Error ? error.message : String(error) },
      'Failed to load plan detail'
    );
    return null;
  }
}

function resolvePlanOwner(data: PlanDetailQuery): PlanOwner | null {
  const plan = data.plan;
  if (plan === null) return null;

  const service = data.services.items.find((item) => item.id === plan.serviceId);
  return {
    href: ROUTES.console.serviceDetail(plan.serviceId),
    id: plan.serviceId,
    name: service?.name ?? plan.serviceId,
    type: 'service',
  };
}
