import { nextPaymentBusinessId } from '@/server/common/utils/business-id';
import { createResourceId } from '@/server/common/utils/resource-id';
import { AppError } from '@/server/common/errors/app-error';
import { createLogger } from '@/server/config/logger.config';
import { requireAdmin } from '@/server/features/common/guards/require-admin.guard';
import { findCustomerById } from '@/server/features/customers/repositories/customers.repository';
import { findMembershipById } from '@/server/features/memberships/repositories/memberships.repository';
import { sendTransactionalEmail } from '@/server/features/notifications/service/notifications.service';
import { buildPaymentReceiptPdf } from '@/server/features/documents/documents.receipt';
import { notifyAdmins } from '@/server/features/notifications/service/notify-admins.service';
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
        void notifyPaymentReceived(payment, dependencies);
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

/**
 * Fire-and-forget: a receipt that fails must not undo a recorded payment.
 *
 * The customer gets a receipt when an address exists; every administrator gets
 * an operator copy regardless, because the ported customers have no email and
 * silence is not an acceptable outcome for a recorded payment.
 */
async function notifyPaymentReceived(
  payment: PaymentRecord,
  dependencies: Dependencies
): Promise<void> {
  try {
    const customer = (await dependencies.findCustomerById?.(payment.customerId)) ?? null;
    const amount = formatCurrency(Number.parseFloat(payment.amount), payment.currencyCode);

    if (customer?.email) {
      const template = buildNotificationTemplate('PAYMENT_RECEIVED', {
        amount,
        customerName: customer.name,
        paidDate: payment.paidDate ?? undefined,
        paymentRef: payment.businessId,
      });
      const receipt =
        dependencies.buildReceiptPdf === undefined
          ? null
          : await dependencies.buildReceiptPdf({ customer, payment }).catch((error: unknown) => {
              log.warn({ err: error }, 'Payment receipt PDF failed — sending without attachment');
              return null;
            });

      await dependencies.sendPaymentNotification?.({
        attachments:
          receipt === null
            ? undefined
            : [
                {
                  content: Buffer.from(receipt.bytes),
                  contentType: 'application/pdf',
                  filename: receipt.filename,
                },
              ],
        event: 'PAYMENT_RECEIVED',
        html: template.html,
        subject: template.subject,
        to: customer.email,
      });
    }

    const adminTemplate = buildNotificationTemplate('ADMIN_PAYMENT_RECEIVED', {
      amount,
      customerName: customer?.name ?? 'Unknown customer',
      paidDate: payment.paidDate ?? undefined,
      paymentRef: payment.businessId,
    });

    await dependencies.notifyAdmins?.({
      event: 'ADMIN_PAYMENT_RECEIVED',
      html: adminTemplate.html,
      subject: adminTemplate.subject,
    });
  } catch (error) {
    log.warn({ err: error }, 'Payment notifications failed — non-fatal');
  }
}

type ReceiptCustomer = {
  businessId: string;
  email: string | null;
  language: string | null;
  name: string;
  phone: string | null;
};

interface Dependencies {
  buildReceiptPdf?: typeof buildPaymentReceiptPdf;
  createPaymentId: () => string;
  findCustomerById?: (id: string) => Promise<ReceiptCustomer | null>;
  findLatestPaymentBusinessId: (year: number) => Promise<string | null>;
  findMembershipById: (id: string) => Promise<{ customerId: string; id: string } | null>;
  insertPayment: (input: Parameters<typeof insertPayment>[0]) => Promise<PaymentRecord | null>;
  notifyAdmins?: typeof notifyAdmins;
  sendPaymentNotification?: (input: {
    attachments?: { content: Buffer; contentType?: string; filename: string }[];
    event: string;
    html: string;
    subject: string;
    to: string;
  }) => Promise<void>;
}

const maxRetryAttempts = 3;

const defaultDependencies: Dependencies = {
  buildReceiptPdf: buildPaymentReceiptPdf,
  createPaymentId: () => createResourceId('pay'),
  findCustomerById,
  findLatestPaymentBusinessId,
  findMembershipById,
  insertPayment,
  notifyAdmins,
  sendPaymentNotification: (input) =>
    sendTransactionalEmail(input).then(() => {
      /* the email result is not part of this contract */
    }),
};
