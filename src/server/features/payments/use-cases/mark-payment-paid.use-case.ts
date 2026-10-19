import { AppError } from '@/server/common/errors/app-error';
import { createLogger } from '@/server/config/logger.config';
import { requireAdmin } from '@/server/features/common/guards/require-admin.guard';
import { findCustomerById } from '@/server/features/customers/repositories/customers.repository';
import {
  findPaymentById,
  updatePaymentPaid,
} from '@/server/features/payments/repositories/payments.repository';
import { sendTransactionalEmail } from '@/server/features/notifications/service/notifications.service';
import { buildNotificationTemplate } from '@/server/features/notifications/templates/notifications.templates';
import type { GqlContext } from '@/server/features/common/schemas/model/context.model';
import type { PaymentRecord } from '@/server/features/payments/schemas/model/payments.model';
import type { MarkPaymentPaidInput } from '@/server/features/payments/schemas/validators/payments.validators';
import { formatCurrency } from '@/lib/utils';

const log = createLogger('mark-payment-paid');

export async function markPaymentPaidUseCase(
  input: MarkPaymentPaidInput,
  context: GqlContext,
  dependencies: MarkPaymentPaidDependencies = defaultDependencies
) {
  requireAdmin(context);

  const payment = await dependencies.findPaymentById(input.id);

  if (payment === null) {
    throw new AppError('Payment not found', 404, 'PAYMENT_NOT_FOUND');
  }

  if (payment.status === 'paid') {
    throw new AppError('Payment is already paid', 409, 'PAYMENT_ALREADY_PAID');
  }

  const paidDate = input.paidDate || new Date().toISOString().slice(0, 10);
  const updatedPayment = await dependencies.updatePaymentPaid(input.id, paidDate);

  if (updatedPayment === null) {
    throw new AppError('Payment could not be marked paid', 500, 'PAYMENT_UPDATE_FAILED');
  }

  const customer = await dependencies.findCustomerById(updatedPayment.customerId);

  if (customer !== null && customer.email !== null) {
    const template = buildNotificationTemplate('PAYMENT_RECEIVED', {
      amount: formatCurrency(Number.parseFloat(updatedPayment.amount), updatedPayment.currencyCode),
      customerName: customer.name,
      paidDate: updatedPayment.paidDate ?? paidDate,
      paymentRef: updatedPayment.businessId,
    });
    dependencies
      .sendPaymentNotification?.({
        event: 'PAYMENT_RECEIVED',
        html: template.html,
        subject: template.subject,
        to: customer.email,
      })
      .catch((error: unknown) => {
        log.warn({ err: error }, 'PAYMENT_RECEIVED notification failed — non-fatal');
      });
  }

  return updatedPayment;
}

interface MarkPaymentPaidDependencies {
  findCustomerById: typeof findCustomerById;
  findPaymentById: (id: string) => Promise<PaymentRecord | null>;
  sendPaymentNotification?: (input: {
    event: string;
    html: string;
    subject: string;
    to: string;
  }) => Promise<void>;
  updatePaymentPaid: (id: string, paidDate: string) => Promise<PaymentRecord | null>;
}

const defaultDependencies: MarkPaymentPaidDependencies = {
  findCustomerById,
  findPaymentById,
  sendPaymentNotification: (input) => sendTransactionalEmail(input).then(() => {}),
  updatePaymentPaid,
};
