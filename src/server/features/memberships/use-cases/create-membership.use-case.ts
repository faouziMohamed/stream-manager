import { AppError } from '@/server/common/errors/app-error';
import { nextMembershipBusinessId, nextPaymentBusinessId } from '@/server/common/utils/business-id';
import { createResourceId } from '@/server/common/utils/resource-id';
import { createLogger } from '@/server/config/logger.config';
import { requireAdmin } from '@/server/features/common/guards/require-admin.guard';
import { findCustomerById } from '@/server/features/customers/repositories/customers.repository';
import {
  findLatestMembershipBusinessId,
  insertMembershipWithPayment,
} from '@/server/features/memberships/repositories/memberships.repository';
import { getYear } from '@/server/features/memberships/use-cases/membership-date.helpers';
import { addTermMonths } from '@/lib/utils/iso-date';
import { sendTransactionalEmail } from '@/server/features/notifications/service/notifications.service';
import { buildNotificationTemplate } from '@/server/features/notifications/templates/notifications.templates';
import { findLatestPaymentBusinessId } from '@/server/features/payments/repositories/payments.repository';
import { findPlanById } from '@/server/features/plans/repositories/plans.repository';
import { findServiceById } from '@/server/features/services/repositories/services.repository';
import type { GqlContext } from '@/server/features/common/schemas/model/context.model';
import type { CreateMembershipInput } from '@/server/features/memberships/schemas/validators/memberships.validators';
import type {
  CustomerRecord,
  InsertMembershipWithPaymentInput,
  MembershipWithPaymentRecord,
  PlanRecord,
} from '@/server/features/memberships/use-cases/membership-records.model';
import type { ServiceModel } from '@/server/features/services/schemas/model/services.model';

const log = createLogger('create-membership');

export async function createMembershipUseCase(
  input: CreateMembershipInput,
  context: GqlContext,
  dependencies: CreateMembershipDependencies = defaultDependencies
) {
  requireAdmin(context);

  const plan = await dependencies.findPlanById(input.planId);

  if (plan === null) {
    throw new AppError('Plan not found', 404, 'MEMBERSHIP_PLAN_NOT_FOUND');
  }

  if (!plan.isActive) {
    throw new AppError('Plan is inactive', 409, 'MEMBERSHIP_PLAN_INACTIVE');
  }

  const service = await dependencies.findServiceById(plan.serviceId);

  if (service === null) {
    throw new AppError('Service not found', 404, 'MEMBERSHIP_SERVICE_NOT_FOUND');
  }

  if (!service.isActive || service.deletedAt !== null) {
    throw new AppError('Referenced service is inactive', 409, 'MEMBERSHIP_SERVICE_INACTIVE');
  }

  const customer = await dependencies.findCustomerById(input.customerId);

  if (customer === null) {
    throw new AppError('Customer not found', 404, 'MEMBERSHIP_CUSTOMER_NOT_FOUND');
  }

  const year = getYear(input.startDate);
  let latestMembershipId = await dependencies.findLatestMembershipBusinessId(year);
  let latestPaymentId = await dependencies.findLatestPaymentBusinessId(year);
  const membershipId = dependencies.createMembershipId();
  const paymentId = dependencies.createPaymentId();

  for (let attempt = 1; attempt <= maxBusinessIdRetryAttempts; attempt += 1) {
    const membershipBusinessId = nextMembershipBusinessId(year, latestMembershipId);
    const paymentBusinessId = nextPaymentBusinessId(year, latestPaymentId);

    try {
      const membership = await dependencies.insertMembershipWithPayment({
        membership: {
          businessId: membershipBusinessId,
          customerId: input.customerId,
          endDate: addTermMonths(input.startDate, plan.durationMonths),
          id: membershipId,
          isRecurring: input.isRecurring,
          planId: input.planId,
          renewedFromId: null,
          startDate: input.startDate,
          status: 'active',
        },
        payment: {
          amount: plan.price,
          businessId: paymentBusinessId,
          currencyCode: plan.currencyCode,
          customerId: input.customerId,
          dueDate: input.startDate,
          id: paymentId,
          membershipId,
          status: 'unpaid',
        },
      });

      if (membership === null) {
        throw new AppError('Membership could not be created', 500, 'MEMBERSHIP_CREATE_FAILED');
      }

      if (customer.email !== null) {
        const template = buildNotificationTemplate('MEMBERSHIP_CREATED', {
          customerName: customer.name,
          endDate: membership.endDate,
          membershipRef: membership.businessId,
          planName: plan.name,
          startDate: membership.startDate,
        });
        dependencies
          .sendMembershipNotification?.({
            event: 'MEMBERSHIP_CREATED',
            html: template.html,
            subject: template.subject,
            to: customer.email,
          })
          .catch((error: unknown) => {
            log.warn({ err: error }, 'MEMBERSHIP_CREATED notification failed — non-fatal');
          });
      }

      return membership;
    } catch (error) {
      if (isUniqueViolation(error) && attempt < maxBusinessIdRetryAttempts) {
        latestMembershipId = membershipBusinessId;
        latestPaymentId = paymentBusinessId;
        continue;
      }

      // Exhausted retries on repeated unique-id collisions: surface the
      // friendly error below instead of leaking the raw DB error.
      if (isUniqueViolation(error)) {
        break;
      }

      throw error;
    }
  }

  throw new AppError('Membership could not be created', 500, 'MEMBERSHIP_CREATE_FAILED');
}

interface CreateMembershipDependencies {
  createMembershipId: () => string;
  createPaymentId: () => string;
  findCustomerById: (id: string) => Promise<CustomerRecord | null>;
  findLatestMembershipBusinessId: (year: number) => Promise<string | null>;
  findLatestPaymentBusinessId: (year: number) => Promise<string | null>;
  findPlanById: (id: string) => Promise<PlanRecord | null>;
  findServiceById: (id: string) => Promise<ServiceModel | null>;
  insertMembershipWithPayment: (
    input: InsertMembershipWithPaymentInput
  ) => Promise<MembershipWithPaymentRecord | null>;
  sendMembershipNotification?: (input: {
    event: string;
    html: string;
    subject: string;
    to: string;
  }) => Promise<void>;
}

const defaultDependencies: CreateMembershipDependencies = {
  createMembershipId: () => createResourceId('mbr'),
  createPaymentId: () => createResourceId('pay'),
  findCustomerById,
  findLatestMembershipBusinessId,
  findLatestPaymentBusinessId,
  findPlanById,
  findServiceById,
  insertMembershipWithPayment,
  sendMembershipNotification: (input) =>
    sendTransactionalEmail(input).then(() => {
      /* the email result is not part of this contract */
    }),
};

const maxBusinessIdRetryAttempts = 3;

function isUniqueViolation(error: unknown): boolean {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return false;
  }

  return error.code === '23505';
}
