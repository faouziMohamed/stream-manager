import { AppError } from '@/server/common/errors/app-error';
import { nextMembershipBusinessId, nextPaymentBusinessId } from '@/server/common/utils/business-id';
import { createResourceId } from '@/server/common/utils/resource-id';
import { createLogger } from '@/server/config/logger.config';
import { requireAdmin } from '@/server/features/common/guards/require-admin.guard';
import { findCustomerById } from '@/server/features/customers/repositories/customers.repository';
import {
  findLatestMembershipBusinessId,
  findMembershipById,
  findMembershipRenewedFrom,
  insertMembershipTerms,
} from '@/server/features/memberships/repositories/memberships.repository';
import { addDays, getYear } from '@/server/features/memberships/use-cases/membership-date.helpers';
import { addTermMonths, todayIsoDate } from '@/lib/utils/iso-date';
import { sendTransactionalEmail } from '@/server/features/notifications/service/notifications.service';
import { buildNotificationTemplate } from '@/server/features/notifications/templates/notifications.templates';
import { findLatestPaymentBusinessId } from '@/server/features/payments/repositories/payments.repository';
import { findPlanById } from '@/server/features/plans/repositories/plans.repository';
import { findServiceById } from '@/server/features/services/repositories/services.repository';
import type { GqlContext } from '@/server/features/common/schemas/model/context.model';
import type { RenewMembershipInput } from '@/server/features/memberships/schemas/validators/memberships.validators';
import type {
  CustomerRecord,
  InsertMembershipWithPaymentInput,
  MembershipRecord,
  MembershipWithPaymentRecord,
  PlanRecord,
} from '@/server/features/memberships/use-cases/membership-records.model';
import type { ServiceModel } from '@/server/features/services/schemas/model/services.model';

const log = createLogger('renew-membership');

export async function renewMembershipUseCase(
  input: RenewMembershipInput,
  context: GqlContext,
  dependencies: RenewMembershipDependencies = defaultDependencies
) {
  requireAdmin(context);

  const oldMembership = await dependencies.findMembershipById(input.id);

  if (oldMembership === null) {
    throw new AppError('Membership not found', 404, 'MEMBERSHIP_NOT_FOUND');
  }

  const plan = await dependencies.findPlanById(oldMembership.planId);

  if (plan === null) {
    throw new AppError('Plan not found', 404, 'MEMBERSHIP_PLAN_NOT_FOUND');
  }

  if (!plan.isActive) {
    throw new AppError(
      'This plan has been deactivated and cannot be renewed',
      409,
      'MEMBERSHIP_PLAN_INACTIVE'
    );
  }

  const service = await dependencies.findServiceById(plan.serviceId);

  if (service === null) {
    throw new AppError('Service not found', 404, 'MEMBERSHIP_SERVICE_NOT_FOUND');
  }

  if (!service.isActive || service.deletedAt !== null) {
    throw new AppError(
      'The streaming service linked to this plan is archived — reactivate it before renewing',
      409,
      'MEMBERSHIP_SERVICE_INACTIVE'
    );
  }

  if (oldMembership.status === 'cancelled') {
    throw new AppError(
      'This membership was cancelled — create a new subscription instead of renewing it',
      409,
      'MEMBERSHIP_CANCELLED'
    );
  }

  // A term that already has a successor is history. Renewing it would start a
  // second chain from its end date, overlapping every later term and billing
  // the customer twice for months they already hold.
  const successor = await dependencies.findMembershipRenewedFrom(oldMembership.id);

  if (successor !== null) {
    throw new AppError(
      `This membership was renewed as ${successor.businessId} — renew the latest term instead`,
      409,
      'MEMBERSHIP_ALREADY_RENEWED'
    );
  }

  const firstStartDate = addDays(oldMembership.endDate, 1);
  const year = getYear(firstStartDate);
  let latestMembershipId = await dependencies.findLatestMembershipBusinessId(year);
  let latestPaymentId = await dependencies.findLatestPaymentBusinessId(year);
  // The money may have been taken before the operator recorded it; the date
  // picker carries that day, and today is only the fallback.
  const settledOn = input.markPaid ? (input.paidDate ?? dependencies.today()) : null;

  for (let attempt = 1; attempt <= maxBusinessIdRetryAttempts; attempt += 1) {
    // Each term starts the day after the previous one ends, so the chain never
    // overlaps itself or leaves the customer uncovered for a day.
    let membershipBusinessId = latestMembershipId;
    let paymentBusinessId = latestPaymentId;
    let startDate = firstStartDate;
    let previousMembershipId = oldMembership.id;
    const terms = [];

    for (let term = 0; term < input.terms; term += 1) {
      const termYear = getYear(startDate);
      membershipBusinessId = nextMembershipBusinessId(termYear, membershipBusinessId);
      paymentBusinessId = nextPaymentBusinessId(termYear, paymentBusinessId);

      const membershipId = dependencies.createMembershipId();
      const endDate = addTermMonths(startDate, plan.durationMonths);

      terms.push({
        membership: {
          businessId: membershipBusinessId,
          customerId: oldMembership.customerId,
          endDate,
          id: membershipId,
          isRecurring: oldMembership.isRecurring,
          planId: oldMembership.planId,
          renewedFromId: previousMembershipId,
          startDate,
          status: 'active' as const,
        },
        payment: {
          amount: plan.price,
          businessId: paymentBusinessId,
          currencyCode: plan.currencyCode,
          customerId: oldMembership.customerId,
          dueDate: startDate,
          id: dependencies.createPaymentId(),
          membershipId,
          paidDate: settledOn,
          status: settledOn === null ? ('unpaid' as const) : ('paid' as const),
        },
      });

      previousMembershipId = membershipId;
      startDate = addDays(endDate, 1);
    }

    try {
      const created = await dependencies.insertMembershipTerms(terms);
      // The last term defines the coverage the operator just bought.
      const membership = created?.at(-1) ?? null;

      if (membership === null) {
        throw new AppError('Membership could not be renewed', 500, 'MEMBERSHIP_RENEW_FAILED');
      }

      const customer = await dependencies.findCustomerById(oldMembership.customerId);

      if (customer !== null && customer.email !== null) {
        // One mail for the whole renewal, covering the first term's start to
        // the last term's end — not one per term.
        const template = buildNotificationTemplate('MEMBERSHIP_RENEWED', {
          customerName: customer.name,
          endDate: membership.endDate,
          membershipRef: membership.businessId,
          planName: plan.name,
          startDate: firstStartDate,
        });
        dependencies
          .sendMembershipNotification?.({
            event: 'MEMBERSHIP_RENEWED',
            html: template.html,
            subject: template.subject,
            to: customer.email,
          })
          .catch((error: unknown) => {
            log.warn({ err: error }, 'MEMBERSHIP_RENEWED notification failed — non-fatal');
          });
      }

      return membership;
    } catch (error) {
      if (isUniqueViolation(error) && attempt < maxBusinessIdRetryAttempts) {
        latestMembershipId = membershipBusinessId;
        latestPaymentId = paymentBusinessId;
        continue;
      }

      throw error;
    }
  }

  throw new AppError('Membership could not be renewed', 500, 'MEMBERSHIP_RENEW_FAILED');
}

interface RenewMembershipDependencies {
  createMembershipId: () => string;
  createPaymentId: () => string;
  findCustomerById: (id: string) => Promise<CustomerRecord | null>;
  findLatestMembershipBusinessId: (year: number) => Promise<string | null>;
  findLatestPaymentBusinessId: (year: number) => Promise<string | null>;
  findMembershipById: (id: string) => Promise<MembershipRecord | null>;
  findMembershipRenewedFrom: (
    renewedFromId: string
  ) => Promise<{ businessId: string; id: string } | null>;
  findPlanById: (id: string) => Promise<PlanRecord | null>;
  findServiceById: (id: string) => Promise<ServiceModel | null>;
  insertMembershipTerms: (
    terms: InsertMembershipWithPaymentInput[]
  ) => Promise<MembershipWithPaymentRecord[] | null>;
  sendMembershipNotification?: (input: {
    event: string;
    html: string;
    subject: string;
    to: string;
  }) => Promise<void>;
  today: () => string;
}

const defaultDependencies: RenewMembershipDependencies = {
  createMembershipId: () => createResourceId('mbr'),
  createPaymentId: () => createResourceId('pay'),
  findCustomerById,
  findLatestMembershipBusinessId,
  findLatestPaymentBusinessId,
  findMembershipById,
  findMembershipRenewedFrom,
  findPlanById,
  findServiceById,
  insertMembershipTerms,
  sendMembershipNotification: (input) => sendTransactionalEmail(input).then(() => {}),
  today: () => todayIsoDate(),
};

const maxBusinessIdRetryAttempts = 3;

function isUniqueViolation(error: unknown): boolean {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return false;
  }

  return error.code === '23505';
}
