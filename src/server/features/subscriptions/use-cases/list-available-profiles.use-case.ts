import { requireAdmin } from '@/server/features/common/guards/require-admin.guard';
import { findAvailableProfilesByServiceId } from '@/server/features/subscriptions/repositories/subscriptions.repository';
import type { GqlContext } from '@/server/features/common/schemas/model/context.model';
import type { AvailableProfilesInput } from '@/server/features/subscriptions/schemas/validators/subscriptions.validators';

/**
 * Free streaming profiles for a service, so the subscription form can offer
 * one without the operator going hunting through accounts first.
 */
export async function listAvailableProfilesUseCase(
  input: AvailableProfilesInput,
  context: GqlContext,
  dependencies: ListAvailableProfilesDependencies = defaultDependencies
) {
  requireAdmin(context);

  return dependencies.findAvailableProfilesByServiceId(input.serviceId);
}

interface ListAvailableProfilesDependencies {
  findAvailableProfilesByServiceId: typeof findAvailableProfilesByServiceId;
}

const defaultDependencies: ListAvailableProfilesDependencies = {
  findAvailableProfilesByServiceId,
};
