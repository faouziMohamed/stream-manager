import { AppError } from '@/server/common/errors/app-error';
import { createLogger } from '@/server/config/logger.config';
import { requireAdmin } from '@/server/features/common/guards/require-admin.guard';
import { findCustomerById } from '@/server/features/customers/repositories/customers.repository';
import {
  findPaymentById,
  updatePaymentPaid,
} from '@/server/features/payments/repositories/payments.repository';
import { buildPaymentReceiptPdf } from '@/server/features/documents/documents.receipt';
import { notifyAdmins } from '@/server/features/notifications/service/notify-admins.service';
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
    const receipt =
      dependencies.buildReceiptPdf === undefined
        ? null
        : await dependencies
            .buildReceiptPdf({ customer, payment: updatedPayment })
            .catch((error: unknown) => {
              // The payment stands even if the PDF cannot be drawn; send the
              // receipt text without the attachment rather than no receipt.
              log.warn({ err: error }, 'Payment receipt PDF failed — sending without attachment');
              return null;
            });

    dependencies
      .sendPaymentNotification?.({
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
      })
      .catch((error: unknown) => {
        log.warn({ err: error }, 'PAYMENT_RECEIVED notification failed — non-fatal');
      });
  }

  const amount = formatCurrency(
    Number.parseFloat(updatedPayment.amount),
    updatedPayment.currencyCode
  );
  const adminTemplate = buildNotificationTemplate('ADMIN_PAYMENT_RECEIVED', {
    amount,
    customerName: customer?.name ?? 'Unknown customer',
    paidDate: updatedPayment.paidDate ?? paidDate,
    paymentRef: updatedPayment.businessId,
  });
  dependencies
    .notifyAdmins?.({
      event: 'ADMIN_PAYMENT_RECEIVED',
      html: adminTemplate.html,
      subject: adminTemplate.subject,
    })
    .catch((error: unknown) => {
      log.warn({ err: error }, 'Admin payment notification failed — non-fatal');
    });

  return updatedPayment;
}

interface MarkPaymentPaidDependencies {
  buildReceiptPdf?: typeof buildPaymentReceiptPdf;
  findCustomerById: typeof findCustomerById;
  findPaymentById: (id: string) => Promise<PaymentRecord | null>;
  notifyAdmins?: typeof notifyAdmins;
  sendPaymentNotification?: (input: {
    attachments?: {
      content: Buffer;
      contentType?: string;
      filename: string;
    }[];
    event: string;
    html: string;
    subject: string;
    to: string;
  }) => Promise<void>;
  updatePaymentPaid: (id: string, paidDate: string) => Promise<PaymentRecord | null>;
}

const defaultDependencies: MarkPaymentPaidDependencies = {
  buildReceiptPdf: buildPaymentReceiptPdf,
  findCustomerById,
  findPaymentById,
  notifyAdmins,
  sendPaymentNotification: (input) =>
    sendTransactionalEmail(input).then(() => {
      /* the email result is not part of this contract */
    }),
  updatePaymentPaid,
};
