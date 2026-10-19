import { validateInput } from '@/server/features/common/middleware/validate-input';
import {
  availableProfilesInputSchema,
  createSubscriptionInputSchema,
} from '@/server/features/subscriptions/schemas/validators/subscriptions.validators';
import {
  createSubscriptionUseCase,
  toSubscriptionError,
} from '@/server/features/subscriptions/use-cases/create-subscription.use-case';
import { listAvailableProfilesUseCase } from '@/server/features/subscriptions/use-cases/list-available-profiles.use-case';
import type { GqlContext } from '@/server/features/common/schemas/model/context.model';

export const subscriptionsResolvers = {
  Query: {
    async availableProfiles(_parent: unknown, args: { serviceId: string }, context: GqlContext) {
      const input = validateInput(availableProfilesInputSchema, args);
      return listAvailableProfilesUseCase(input, context);
    },
  },
  Mutation: {
    async createSubscription(_parent: unknown, args: ResolverArgs<unknown>, context: GqlContext) {
      const input = validateInput(createSubscriptionInputSchema, args.input);

      try {
        const result = await createSubscriptionUseCase(input, context);

        return {
          assignedProfileId: result.assignment?.profileId ?? null,
          customerId: result.customerId,
          endDate: result.membership.endDate,
          id: result.membership.id,
          paymentId: result.payment.id,
          paymentStatus: result.payment.status,
          reference: result.membership.businessId,
          startDate: result.membership.startDate,
        };
      } catch (error) {
        throw toSubscriptionError(error);
      }
    },
  },
};

interface ResolverArgs<TInput> {
  input: TInput;
}
