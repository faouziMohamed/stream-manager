import { paginationMeta } from '@/server/common/utils/pagination';
import { requireAuth } from '@/server/features/common/guards/require-auth.guard';
import type { GqlContext } from '@/server/features/common/schemas/model/context.model';
import { findPlanById, findPlans } from '@/server/features/plans/repositories/plans.repository';

export async function getPlansUseCase(
  input: GetPlansInput,
  context: GqlContext,
  dependencies: GetPlansDependencies = defaultDependencies
) {
  requireAuth(context);

  const result = await dependencies.findPlans(input);

  return {
    items: result.items.map((item) => toPlanDto(item)),
    pageInfo: paginationMeta(result.total, input.page, input.pageSize),
  };
}

export async function getPlanUseCase(
  id: string,
  context: GqlContext,
  dependencies: GetPlanDependencies = defaultGetPlanDependencies
) {
  requireAuth(context);

  const plan = await dependencies.findPlanById(id);
  return plan === null ? null : toPlanDto(plan);
}

type PlanRecord = NonNullable<Awaited<ReturnType<typeof findPlanById>>>;

interface GetPlansInput {
  isActive?: boolean;
  page: number;
  pageSize: number;
  planType?: 'individual' | 'shared' | 'family';
  serviceId?: string;
}

interface FindPlansResult {
  items: PlanRecord[];
  total: number;
}

interface GetPlansDependencies {
  findPlans: (input: GetPlansInput) => Promise<FindPlansResult>;
}

interface GetPlanDependencies {
  findPlanById: (id: string) => Promise<PlanRecord | null>;
}

function toPlanDto(plan: PlanRecord) {
  return {
    createdAt: plan.createdAt.toISOString(),
    currencyCode: plan.currencyCode,
    descriptionContent: plan.descriptionContent,
    durationMonths: plan.durationMonths,
    id: plan.id,
    isActive: plan.isActive,
    name: plan.name,
    planType: plan.planType,
    price: plan.price,
    serviceId: plan.serviceId,
    updatedAt: plan.updatedAt.toISOString(),
  };
}

const defaultDependencies: GetPlansDependencies = {
  findPlans,
};

const defaultGetPlanDependencies: GetPlanDependencies = {
  findPlanById,
};
