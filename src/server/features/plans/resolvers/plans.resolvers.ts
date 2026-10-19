import { validateInput } from '@/server/features/common/middleware/validate-input';
import type { GqlContext } from '@/server/features/common/schemas/model/context.model';
import {
  createPlanInputSchema,
  deletePlanInputSchema,
  getPlanInputSchema,
  listPlansInputSchema,
  updatePlanInputSchema,
} from '@/server/features/plans/schemas/validators/plans.validators';
import { deletePlanUseCase } from '@/server/features/plans/use-cases/delete-plan.use-case';
import { createPlanUseCase } from '@/server/features/plans/use-cases/create-plan.use-case';
import {
  getPlanUseCase,
  getPlansUseCase,
} from '@/server/features/plans/use-cases/get-plans.use-case';
import { updatePlanUseCase } from '@/server/features/plans/use-cases/update-plan.use-case';

export const plansResolvers = {
  Query: {
    async plan(_parent: unknown, args: { id: string }, context: GqlContext) {
      const input = validateInput(getPlanInputSchema, args);
      return getPlanUseCase(input.id, context);
    },
    async plans(_parent: unknown, args: unknown, context: GqlContext) {
      const input = validateInput(listPlansInputSchema, args);
      return getPlansUseCase(input, context);
    },
  },
  Mutation: {
    async createPlan(_parent: unknown, args: ResolverArgs<unknown>, context: GqlContext) {
      const input = validateInput(createPlanInputSchema, args.input);
      const plan = await createPlanUseCase(input, context);

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
    },
    async deletePlan(_parent: unknown, args: ResolverArgs<unknown>, context: GqlContext) {
      const input = validateInput(deletePlanInputSchema, args.input);
      const plan = await deletePlanUseCase(input.id, context);

      return toPlanDto(plan);
    },
    async updatePlan(_parent: unknown, args: ResolverArgs<unknown>, context: GqlContext) {
      const input = validateInput(updatePlanInputSchema, args.input);
      const plan = await updatePlanUseCase(input, context);

      return toPlanDto(plan);
    },
  },
};

function toPlanDto(plan: {
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
}) {
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

interface ResolverArgs<TInput> {
  input: TInput;
}
