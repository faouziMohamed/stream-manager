import { AppError } from '@/server/common/errors/app-error';
import { requireAdmin } from '@/server/features/common/guards/require-admin.guard';
import {
  countMembershipsForPlan,
  deletePlan,
  findPlanById,
} from '@/server/features/plans/repositories/plans.repository';
import type { GqlContext } from '@/server/features/common/schemas/model/context.model';

export async function deletePlanUseCase(
  id: string,
  context: GqlContext,
  dependencies: DeletePlanDependencies = defaultDependencies
) {
  requireAdmin(context);

  const existingPlan = await dependencies.findPlanById(id);

  if (existingPlan === null) {
    throw new AppError('Plan not found', 404, 'PLAN_NOT_FOUND');
  }

  const membershipCount = await dependencies.countMembershipsForPlan(id);

  if (membershipCount > 0) {
    throw new AppError(
      'This plan has memberships and cannot be deleted. Archive it instead.',
      409,
      'PLAN_HAS_MEMBERSHIPS'
    );
  }

  const plan = await dependencies.deletePlan(id);

  if (plan === null) {
    throw new AppError('Plan could not be deleted', 500, 'PLAN_DELETE_FAILED');
  }

  return plan;
}

interface PlanRecord {
  createdAt: Date;
  currencyCode: string;
  descriptionContent: unknown;
  durationMonths: number;
  id: string;
  isActive: boolean;
  name: string;
  planType: 'individual' | 'shared' | 'family';
  price: string;
  serviceId: string;
  updatedAt: Date;
}

interface DeletePlanDependencies {
  countMembershipsForPlan: (planId: string) => Promise<number>;
  deletePlan: (id: string) => Promise<PlanRecord | null>;
  findPlanById: (id: string) => Promise<PlanRecord | null>;
}

const defaultDependencies: DeletePlanDependencies = {
  countMembershipsForPlan,
  deletePlan,
  findPlanById,
};
