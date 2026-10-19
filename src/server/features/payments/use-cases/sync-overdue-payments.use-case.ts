import { createLogger } from '@/server/config/logger.config';
import { findCustomerById } from '@/server/features/customers/repositories/customers.repository';
import { markOverduePaymentsBefore } from '@/server/features/payments/repositories/payments.repository';
import { sendTransactionalEmail } from '@/server/features/notifications/service/notifications.service';
import { buildNotificationTemplate } from '@/server/features/notifications/templates/notifications.templates';
import type { PaymentRecord } from '@/server/features/payments/schemas/model/payments.model';

const log = createLogger('sync-overdue-payments');

export async function syncOverduePaymentsUseCase(
  dependencies: SyncOverduePaymentsDependencies = defaultDependencies,
  today = new Date().toISOString().slice(0, 10)
) {
  const payments = await dependencies.markOverduePaymentsBefore(today);

  await Promise.all(
    payments.map((payment) =>
      dependencies
        .notifyPaymentOverdue?.(payment)
        .catch((error: unknown) =>
          log.warn({ err: error, paymentId: payment.id }, 'PAYMENT_OVERDUE notification failed')
        )
    )
  );

  return {
    updatedCount: payments.length,
  };
}

async function defaultNotifyPaymentOverdue(payment: PaymentRecord): Promise<void> {
  const customer = await findCustomerById(payment.customerId);
  if (customer === null || customer.email === null) return;

  const template = buildNotificationTemplate('PAYMENT_OVERDUE', {
    customerName: customer.name,
    dueDate: payment.dueDate,
  });

  await sendTransactionalEmail({
    event: 'PAYMENT_OVERDUE',
    html: template.html,
    subject: template.subject,
    to: customer.email,
  });
}

interface SyncOverduePaymentsDependencies {
  markOverduePaymentsBefore: (cutoffDate: string) => Promise<PaymentRecord[]>;
  notifyPaymentOverdue?: (payment: PaymentRecord) => Promise<void>;
}

const defaultDependencies: SyncOverduePaymentsDependencies = {
  markOverduePaymentsBefore,
  notifyPaymentOverdue: defaultNotifyPaymentOverdue,
};
