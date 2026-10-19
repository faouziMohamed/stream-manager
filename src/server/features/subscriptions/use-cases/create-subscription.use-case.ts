import { AppError } from '@/server/common/errors/app-error';
import {
  nextCustomerBusinessId,
  nextMembershipBusinessId,
  nextPaymentBusinessId,
} from '@/server/common/utils/business-id';
import { createResourceId } from '@/server/common/utils/resource-id';
import { createLogger } from '@/server/config/logger.config';
import { requireAdmin } from '@/server/features/common/guards/require-admin.guard';
import {
  findCustomerById,
  findLatestCustomerBusinessId,
} from '@/server/features/customers/repositories/customers.repository';
import { getYear } from '@/server/features/memberships/use-cases/membership-date.helpers';
import { addTermMonths } from '@/lib/utils/iso-date';
import { findLatestMembershipBusinessId } from '@/server/features/memberships/repositories/memberships.repository';
import { sendTransactionalEmail } from '@/server/features/notifications/service/notifications.service';
import { buildNotificationTemplate } from '@/server/features/notifications/templates/notifications.templates';
import { findLatestPaymentBusinessId } from '@/server/features/payments/repositories/payments.repository';
import { findPlanById } from '@/server/features/plans/repositories/plans.repository';
import { findServiceById } from '@/server/features/services/repositories/services.repository';
import {
  ProfileAlreadyClaimedError,
  insertSubscription,
} from '@/server/features/subscriptions/repositories/subscriptions.repository';
import type { GqlContext } from '@/server/features/common/schemas/model/context.model';
import type { CreateSubscriptionInput } from '@/server/features/subscriptions/schemas/validators/subscriptions.validators';

const log = createLogger('create-subscription');

/**
 * Creates a whole subscription from one operator action.
 *
 * This replaces the four-step dance of create customer → create membership →
 * record payment → assign profile. Everything below either lands together or
 * not at all, so a failure can no longer leave an orphan membership with no
 * payment, or a profile marked assigned against nothing.
 */
export async function createSubscriptionUseCase(
  input: CreateSubscriptionInput,
  context: GqlContext,
  dependencies: CreateSubscriptionDependencies = defaultDependencies
) {
  requireAdmin(context);

  const plan = await dependencies.findPlanById(input.planId);

  if (plan === null) {
    throw new AppError('Plan not found', 404, 'SUBSCRIPTION_PLAN_NOT_FOUND');
  }

  if (!plan.isActive) {
    throw new AppError('Plan is inactive', 409, 'SUBSCRIPTION_PLAN_INACTIVE');
  }

  const service = await dependencies.findServiceById(plan.serviceId);

  if (service === null) {
    throw new AppError('Service not found', 404, 'SUBSCRIPTION_SERVICE_NOT_FOUND');
  }

  if (!service.isActive || service.deletedAt !== null) {
    throw new AppError('Referenced service is inactive', 409, 'SUBSCRIPTION_SERVICE_INACTIVE');
  }

  const customer = await resolveCustomer(input, dependencies);
  const year = dependencies.getYear(input.startDate);

  const [latestMembershipId, latestPaymentId, latestCustomerId] = await Promise.all([
    dependencies.findLatestMembershipBusinessId(year),
    dependencies.findLatestPaymentBusinessId(year),
    customer.isNew ? dependencies.findLatestCustomerBusinessId() : Promise.resolve(null),
  ]);

  const result = await dependencies.insertSubscription({
    existingCustomerId: customer.id,
    membership: {
      businessId: nextMembershipBusinessId(year, latestMembershipId),
      endDate: dependencies.addTermMonths(input.startDate, plan.durationMonths),
      id: dependencies.createMembershipId(),
      isRecurring: input.isRecurring,
      planId: input.planId,
      renewedFromId: null,
      startDate: input.startDate,
      status: 'active',
    },
    newCustomer: customer.isNew
      ? {
          businessId: nextCustomerBusinessId(latestCustomerId),
          email: customer.email,
          id: customer.id,
          isActive: true,
          name: customer.name,
          phone: customer.phone,
        }
      : null,
    payment: {
      amount: plan.price,
      businessId: nextPaymentBusinessId(year, latestPaymentId),
      currencyCode: plan.currencyCode,
      dueDate: input.startDate,
      id: dependencies.createPaymentId(),
      paidDate: input.markPaid ? input.startDate : null,
      status: input.markPaid ? 'paid' : 'unpaid',
    },
    profile:
      input.profile === null
        ? null
        : {
            accountId: input.profile.accountId,
            assignmentId: dependencies.createAssignmentId(),
            profileId: input.profile.profileId,
          },
  });

  if (result === null) {
    throw new AppError('Subscription could not be created', 500, 'SUBSCRIPTION_CREATE_FAILED');
  }

  notifyCustomer(customer, plan.name, result, dependencies);

  return result;
}

async function resolveCustomer(
  input: CreateSubscriptionInput,
  dependencies: CreateSubscriptionDependencies
): Promise<ResolvedCustomer> {
  if (input.newCustomer !== null) {
    return {
      email: input.newCustomer.email ?? null,
      id: dependencies.createCustomerId(),
      isNew: true,
      name: input.newCustomer.name,
      phone: input.newCustomer.phone ?? null,
    };
  }

  const existing = await dependencies.findCustomerById(input.customerId);

  if (existing === null) {
    throw new AppError('Customer not found', 404, 'SUBSCRIPTION_CUSTOMER_NOT_FOUND');
  }

  if (!existing.isActive) {
    throw new AppError('Customer is archived', 409, 'SUBSCRIPTION_CUSTOMER_ARCHIVED');
  }

  return {
    email: existing.email,
    id: existing.id,
    isNew: false,
    name: existing.name,
    phone: existing.phone,
  };
}

function notifyCustomer(
  customer: ResolvedCustomer,
  planName: string,
  result: SubscriptionResult,
  dependencies: CreateSubscriptionDependencies
): void {
  if (customer.email === null) {
    return;
  }

  const template = buildNotificationTemplate('MEMBERSHIP_CREATED', {
    customerName: customer.name,
    endDate: result.membership.endDate,
    membershipRef: result.membership.businessId,
    planName,
    startDate: result.membership.startDate,
  });

  dependencies
    .sendSubscriptionNotification?.({
      event: 'MEMBERSHIP_CREATED',
      html: template.html,
      subject: template.subject,
      to: customer.email,
    })
    .catch((error: unknown) => {
      log.warn({ err: error }, 'MEMBERSHIP_CREATED notification failed — non-fatal');
    });
}

/** Surfaces the in-transaction profile race as a friendly conflict. */
export function toSubscriptionError(error: unknown): unknown {
  if (error instanceof ProfileAlreadyClaimedError) {
    return new AppError(
      'That streaming profile was just taken. Pick another one.',
      409,
      'SUBSCRIPTION_PROFILE_TAKEN'
    );
  }

  return error;
}

type ResolvedCustomer = {
  email: string | null;
  id: string;
  isNew: boolean;
  name: string;
  phone: string | null;
};

/** The slice of the transaction result this use-case and its callers read. */
export interface SubscriptionResult {
  assignment: { profileId: string | null } | null;
  customerId: string;
  membership: { businessId: string; endDate: string; id: string; startDate: string };
  payment: { id: string; status: string };
}

/** Only the fields this use-case actually reads, so tests stay small. */
interface PlanLike {
  currencyCode: string;
  durationMonths: number;
  isActive: boolean;
  name: string;
  price: string;
  serviceId: string;
}

interface ServiceLike {
  deletedAt: Date | null;
  isActive: boolean;
}

interface CustomerLike {
  email: string | null;
  id: string;
  isActive: boolean;
  name: string;
  phone: string | null;
}

interface CreateSubscriptionDependencies {
  addTermMonths: typeof addTermMonths;
  createAssignmentId: () => string;
  createCustomerId: () => string;
  createMembershipId: () => string;
  createPaymentId: () => string;
  findCustomerById: (id: string) => Promise<CustomerLike | null>;
  findLatestCustomerBusinessId: () => Promise<string | null>;
  findLatestMembershipBusinessId: (year: number) => Promise<string | null>;
  findLatestPaymentBusinessId: (year: number) => Promise<string | null>;
  findPlanById: (id: string) => Promise<PlanLike | null>;
  findServiceById: (id: string) => Promise<ServiceLike | null>;
  getYear: typeof getYear;
  insertSubscription: (
    input: Parameters<typeof insertSubscription>[0]
  ) => Promise<SubscriptionResult | null>;
  sendSubscriptionNotification?: (input: {
    event: string;
    html: string;
    subject: string;
    to: string;
  }) => Promise<void>;
}

const defaultDependencies: CreateSubscriptionDependencies = {
  addTermMonths,
  createAssignmentId: () => createResourceId('asg'),
  createCustomerId: () => createResourceId('cst'),
  createMembershipId: () => createResourceId('mbr'),
  createPaymentId: () => createResourceId('pay'),
  findCustomerById,
  findLatestCustomerBusinessId,
  findLatestMembershipBusinessId,
  findLatestPaymentBusinessId,
  findPlanById,
  findServiceById,
  getYear,
  insertSubscription,
  sendSubscriptionNotification: (input) => sendTransactionalEmail(input).then(() => {}),
};
