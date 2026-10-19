import { validateInput } from '@/server/features/common/middleware/validate-input';
import {
  cancelMembershipInputSchema,
  createMembershipInputSchema,
  membershipFiltersSchema,
  renewMembershipInputSchema,
} from '@/server/features/memberships/schemas/validators/memberships.validators';
import { cancelMembershipUseCase } from '@/server/features/memberships/use-cases/cancel-membership.use-case';
import { createMembershipUseCase } from '@/server/features/memberships/use-cases/create-membership.use-case';
import {
  getMembershipUseCase,
  getMembershipsUseCase,
} from '@/server/features/memberships/use-cases/get-memberships.use-case';
import { renewMembershipUseCase } from '@/server/features/memberships/use-cases/renew-membership.use-case';
import type { GqlContext } from '@/server/features/common/schemas/model/context.model';

export const membershipsResolvers = {
  Mutation: {
    async cancelMembership(_parent: unknown, args: ResolverArgs<unknown>, context: GqlContext) {
      const input = validateInput(cancelMembershipInputSchema, args.input);
      const membership = await cancelMembershipUseCase(input, context);

      return toMembershipDto(membership);
    },
    async createMembership(_parent: unknown, args: ResolverArgs<unknown>, context: GqlContext) {
      const input = validateInput(createMembershipInputSchema, args.input);
      const membership = await createMembershipUseCase(input, context);

      return toMembershipDto(membership);
    },
    async renewMembership(_parent: unknown, args: ResolverArgs<unknown>, context: GqlContext) {
      const input = validateInput(renewMembershipInputSchema, args.input);
      const membership = await renewMembershipUseCase(input, context);

      return toMembershipDto(membership);
    },
  },
  Query: {
    async membership(_parent: unknown, args: MembershipQueryArgs, context: GqlContext) {
      return getMembershipUseCase(args.id, context);
    },
    async memberships(_parent: unknown, args: unknown, context: GqlContext) {
      const input = validateInput(membershipFiltersSchema, args);

      return getMembershipsUseCase(input, context);
    },
  },
};

function toMembershipDto(membership: {
  businessId: string;
  createdAt: Date;
  customerId: string;
  endDate: string;
  id: string;
  isRecurring: boolean;
  planId: string;
  renewedFromId: string | null;
  startDate: string;
  status: string;
  updatedAt: Date;
}) {
  return {
    businessId: membership.businessId,
    createdAt: membership.createdAt.toISOString(),
    customerId: membership.customerId,
    endDate: membership.endDate,
    id: membership.id,
    isRecurring: membership.isRecurring,
    planId: membership.planId,
    renewedFromId: membership.renewedFromId,
    startDate: membership.startDate,
    status: membership.status,
    updatedAt: membership.updatedAt.toISOString(),
  };
}

interface ResolverArgs<TInput> {
  input: TInput;
}

interface MembershipQueryArgs {
  id: string;
}
