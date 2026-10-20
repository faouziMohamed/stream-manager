import { nextPaymentBusinessId } from '@/server/common/utils/business-id';
import { createResourceId } from '@/server/common/utils/resource-id';
import { AppError } from '@/server/common/errors/app-error';
import { createLogger } from '@/server/config/logger.config';
import { requireAdmin } from '@/server/features/common/guards/require-admin.guard';
import { findCustomerById } from '@/server/features/customers/repositories/customers.repository';
import { findMembershipById } from '@/server/features/memberships/repositories/memberships.repository';
import { sendTransactionalEmail } from '@/server/features/notifications/service/notifications.service';
import { buildNotificationTemplate } from '@/server/features/notifications/templates/notifications.templates';
import { formatCurrency } from '@/lib/utils';
import {
  findLatestPaymentBusinessId,
  insertPayment,
} from '@/server/features/payments/repositories/payments.repository';
import type { GqlContext } from '@/server/features/common/schemas/model/context.model';
import type { CreatePaymentInput } from '@/server/features/payments/schemas/validators/payments.validators';
import type { PaymentRecord } from '@/server/features/payments/schemas/model/payments.model';

const log = createLogger('create-payment');

export async function createPaymentUseCase(
  input: CreatePaymentInput,
  context: GqlContext,
  dependencies: Dependencies = defaultDependencies
) {
  requireAdmin(context);

  const membership = await dependencies.findMembershipById(input.membershipId);

  if (membership === null) {
    throw new AppError('Membership not found', 404, 'MEMBERSHIP_NOT_FOUND');
  }

  const paymentId = dependencies.createPaymentId();
  const year = new Date().getFullYear();
  let latestBusinessId = await dependencies.findLatestPaymentBusinessId(year);

  for (let attempt = 1; attempt <= maxRetryAttempts; attempt += 1) {
    const businessId = nextPaymentBusinessId(year, latestBusinessId);

    try {
      const payment = await dependencies.insertPayment({
        amount: input.amount,
        businessId,
        currencyCode: input.currencyCode,
        customerId: membership.customerId,
        dueDate: input.dueDate,
        id: paymentId,
        membershipId: input.membershipId,
        method: input.method ?? null,
        notes: input.notes ?? null,
        paidDate: input.paidDate ?? (input.status === 'paid' ? input.dueDate : null),
        status: input.status,
      });

      if (payment === null) {
        throw new AppError('Failed to record payment', 500, 'PAYMENT_CREATE_FAILED');
      }

      // Money recorded as already received earns a receipt, exactly as an
      // existing payment marked paid does. An unpaid charge has nothing to
      // acknowledge yet.
      if (payment.status === 'paid') {
        notifyPaymentReceived(payment, dependencies);
      }

      return payment;
    } catch (error) {
      const isUniqueViolation =
        error instanceof Error && 'code' in error && (error as { code: string }).code === '23505';

      if (isUniqueViolation && attempt < maxRetryAttempts) {
        latestBusinessId = businessId;
        continue;
      }

      // Exhausted retries on repeated unique-id collisions: surface the
      // friendly error below instead of leaking the raw DB error.
      if (isUniqueViolation) {
        break;
      }

      throw error;
    }
  }

  throw new AppError('Failed to record payment after retries', 500, 'PAYMENT_CREATE_FAILED');
}

/** Fire-and-forget: a receipt that fails must not undo a recorded payment. */
function notifyPaymentReceived(payment: PaymentRecord, dependencies: Dependencies): void {
  dependencies
    .findCustomerById?.(payment.customerId)
    .then((customer) => {
      if (customer === null || customer === undefined || customer.email === null) return;

      const template = buildNotificationTemplate('PAYMENT_RECEIVED', {
        amount: formatCurrency(Number.parseFloat(payment.amount), payment.currencyCode),
        customerName: customer.name,
        paidDate: payment.paidDate ?? undefined,
        paymentRef: payment.businessId,
      });

      return dependencies.sendPaymentNotification?.({
        event: 'PAYMENT_RECEIVED',
        html: template.html,
        subject: template.subject,
        to: customer.email,
      });
    })
    .catch((error: unknown) => {
      log.warn({ err: error }, 'PAYMENT_RECEIVED notification failed — non-fatal');
    });
}

interface Dependencies {
  createPaymentId: () => string;
  findCustomerById?: (id: string) => Promise<{ email: string | null; name: string } | null>;
  findLatestPaymentBusinessId: (year: number) => Promise<string | null>;
  findMembershipById: (id: string) => Promise<{ customerId: string; id: string } | null>;
  insertPayment: (input: Parameters<typeof insertPayment>[0]) => Promise<PaymentRecord | null>;
  sendPaymentNotification?: (input: {
    event: string;
    html: string;
    subject: string;
    to: string;
  }) => Promise<void>;
}

const maxRetryAttempts = 3;

const defaultDependencies: Dependencies = {
  createPaymentId: () => createResourceId('pay'),
  findCustomerById,
  findLatestPaymentBusinessId,
  findMembershipById,
  insertPayment,
  sendPaymentNotification: (input) =>
    sendTransactionalEmail(input).then(() => {
      /* the email result is not part of this contract */
    }),
};
