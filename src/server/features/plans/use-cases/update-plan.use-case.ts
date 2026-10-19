import { AppError } from '@/server/common/errors/app-error';
import { requireAdmin } from '@/server/features/common/guards/require-admin.guard';
import { findPlanById, updatePlan } from '@/server/features/plans/repositories/plans.repository';
import type { GqlContext } from '@/server/features/common/schemas/model/context.model';
import type { UpdatePlanInput } from '@/server/features/plans/schemas/validators/plans.validators';
import { findServiceById } from '@/server/features/services/repositories/services.repository';

export async function updatePlanUseCase(
  input: UpdatePlanInput,
  context: GqlContext,
  dependencies: UpdatePlanDependencies = defaultDependencies
) {
  requireAdmin(context);

  const existingPlan = await dependencies.findPlanById(input.id);

  if (existingPlan === null) {
    throw new AppError('Plan not found', 404, 'PLAN_NOT_FOUND');
  }

  if (input.serviceId !== undefined) {
    const service = await dependencies.findServiceById(input.serviceId);

    if (service === null) {
      throw new AppError('Service not found for plan update', 404, 'PLAN_SERVICE_NOT_FOUND');
    }

    if (!service.isActive) {
      throw new AppError('Referenced service is inactive', 409, 'PLAN_SERVICE_INACTIVE');
    }
  }

  const plan = await dependencies.updatePlan(input.id, {
    currencyCode: input.currencyCode,
    descriptionContent: input.descriptionContent,
    durationMonths: input.durationMonths,
    isActive: input.isActive,
    name: input.name,
    planType: input.planType,
    price: input.price,
    serviceId: input.serviceId,
  });

  if (plan === null) {
    throw new AppError('Plan could not be updated', 500, 'PLAN_UPDATE_FAILED');
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

interface UpdatePlanRepositoryInput {
  currencyCode?: string;
  descriptionContent?: unknown;
  durationMonths?: number;
  isActive?: boolean;
  name?: string;
  planType?: 'individual' | 'shared' | 'family';
  price?: string;
  serviceId?: string;
}

interface UpdatePlanDependencies {
  findPlanById: (id: string) => Promise<PlanRecord | null>;
  findServiceById: (id: string) => Promise<{ id: string; isActive: boolean } | null>;
  updatePlan: (id: string, input: UpdatePlanRepositoryInput) => Promise<PlanRecord | null>;
}

const defaultDependencies: UpdatePlanDependencies = {
  findPlanById,
  findServiceById,
  updatePlan,
};
