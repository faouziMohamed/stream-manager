import { AppError } from '@/server/common/errors/app-error';
import { createResourceId } from '@/server/common/utils/resource-id';
import { requireAdmin } from '@/server/features/common/guards/require-admin.guard';
import { insertPlan } from '@/server/features/plans/repositories/plans.repository';
import type { CreatePlanInput } from '@/server/features/plans/schemas/validators/plans.validators';
import { findServiceById } from '@/server/features/services/repositories/services.repository';
import type { GqlContext } from '@/server/features/common/schemas/model/context.model';
import type { ServiceModel } from '@/server/features/services/schemas/model/services.model';

export async function createPlanUseCase(
  input: CreatePlanInput,
  context: GqlContext,
  dependencies: CreatePlanDependencies = defaultDependencies
) {
  requireAdmin(context);

  const service = await dependencies.findServiceById(input.serviceId);

  if (service === null) {
    throw new AppError('Service not found for plan creation', 404, 'PLAN_SERVICE_NOT_FOUND');
  }

  if (!service.isActive) {
    throw new AppError('Referenced service is inactive', 409, 'PLAN_SERVICE_INACTIVE');
  }

  const plan = await dependencies.insertPlan({
    currencyCode: input.currencyCode,
    descriptionContent: input.descriptionContent ?? null,
    durationMonths: input.durationMonths,
    id: dependencies.createId(),
    isActive: true,
    name: input.name,
    planType: input.planType,
    price: input.price,
    serviceId: input.serviceId,
  });

  if (plan === null) {
    throw new AppError('Plan could not be created', 500, 'PLAN_CREATE_FAILED');
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

interface InsertPlanInput {
  currencyCode: string;
  descriptionContent?: unknown;
  durationMonths: number;
  id: string;
  isActive: boolean;
  name: string;
  planType: 'individual' | 'shared' | 'family';
  price: string;
  serviceId: string;
}

interface CreatePlanDependencies {
  createId: () => string;
  findServiceById: (id: string) => Promise<ServiceModel | null>;
  insertPlan: (input: InsertPlanInput) => Promise<PlanRecord | null>;
}

const defaultDependencies: CreatePlanDependencies = {
  createId: () => createResourceId('pln'),
  findServiceById,
  insertPlan,
};
