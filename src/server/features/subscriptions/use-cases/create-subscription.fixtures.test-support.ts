import {
  customerRecord,
  planRecord,
  serviceRecord,
} from '@/server/features/memberships/use-cases/create-membership.fixtures.test-support';
import { getYear } from '@/server/features/memberships/use-cases/membership-date.helpers';
import { addTermMonths } from '@/lib/utils/iso-date';

export {
  adminContext,
  customerRecord,
  planRecord,
  serviceRecord,
  userContext,
} from '@/server/features/memberships/use-cases/create-membership.fixtures.test-support';

export const validInput = {
  customerId: 'cst_test',
  isRecurring: false,
  markPaid: false,
  newCustomer: null,
  planId: 'pln_test',
  profile: null,
  startDate: '2026-05-10',
};

type InsertArgs = Parameters<
  NonNullable<
    Parameters<typeof import('./create-subscription.use-case').createSubscriptionUseCase>[2]
  >['insertSubscription']
>[0];

/**
 * Builds the dependency bundle with every collaborator stubbed. Tests override
 * only the one thing they are about, and `captured` exposes what the use-case
 * handed to the repository.
 */
export function createDependencies(overrides: Record<string, unknown> = {}) {
  const captured: { insert: InsertArgs | null } = { insert: null };

  const dependencies = {
    addTermMonths,
    createAssignmentId: () => 'asg_test',
    createCustomerId: () => 'cst_new',
    createMembershipId: () => 'mbr_test',
    createPaymentId: () => 'pay_test',
    findCustomerById: async () => customerRecord,
    findLatestCustomerBusinessId: async () => null,
    findLatestMembershipBusinessId: async () => null,
    findLatestPaymentBusinessId: async () => null,
    findPlanById: async () => planRecord,
    findServiceById: async () => serviceRecord,
    getYear,
    insertSubscription: async (input: InsertArgs) => {
      captured.insert = input;
      return {
        assignment: input.profile === null ? null : { profileId: input.profile.profileId },
        customerId: input.newCustomer?.id ?? input.existingCustomerId,
        membership: {
          businessId: input.membership.businessId,
          endDate: input.membership.endDate,
          id: input.membership.id,
          startDate: input.membership.startDate,
        },
        payment: { id: input.payment.id, status: input.payment.status ?? 'unpaid' },
      };
    },
    // Email is a side effect; tests assert on data, not delivery.
    sendSubscriptionNotification: async () => {},
    ...overrides,
  };

  return { captured, dependencies };
}
