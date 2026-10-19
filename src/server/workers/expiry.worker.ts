import { createLogger } from '@/server/config/logger.config';
import { findCustomerById } from '@/server/features/customers/repositories/customers.repository';
import {
  expireActiveMembershipsEndingOn,
  findActiveMembershipsEndingOn,
} from '@/server/features/memberships/repositories/memberships.repository';
import { addDays } from '@/server/features/memberships/use-cases/membership-date.helpers';
import { sendTransactionalEmail } from '@/server/features/notifications/service/notifications.service';
import { buildNotificationTemplate } from '@/server/features/notifications/templates/notifications.templates';
import type { MembershipRecord } from '@/server/features/memberships/schemas/model/memberships.model';

const logger = createLogger('worker-expiry');

export async function runMembershipExpiringWorker(
  dependencies: ExpiryWorkerDependencies = defaultDependencies
) {
  const today = dependencies.getToday();
  const targetDate = addDays(today, 3);

  try {
    const memberships = await dependencies.findActiveMembershipsEndingOn(targetDate);
    await Promise.all(
      memberships.map(async (membership) => {
        await dependencies
          .notifyMembershipLifecycle?.('MEMBERSHIP_EXPIRING', membership)
          .catch((error) =>
            logger.warn({ err: error, membershipId: membership.id }, 'Expiring notification failed')
          );
      })
    );

    dependencies.logInfo(
      { count: memberships.length, targetDate },
      'Membership expiring notifications emitted'
    );
    return { notifiedCount: memberships.length, targetDate };
  } catch (error) {
    dependencies.logError({ error, targetDate }, 'Membership expiring worker failed');
    throw error;
  }
}

export async function runMembershipExpiredWorker(
  dependencies: ExpiryWorkerDependencies = defaultDependencies
) {
  const today = dependencies.getToday();

  try {
    const memberships = await dependencies.expireActiveMembershipsEndingOn(today);
    await Promise.all(
      memberships.map(async (membership) => {
        await dependencies
          .notifyMembershipLifecycle?.('MEMBERSHIP_EXPIRED', membership)
          .catch((error) =>
            logger.warn({ err: error, membershipId: membership.id }, 'Expired notification failed')
          );
      })
    );

    dependencies.logInfo({ count: memberships.length, targetDate: today }, 'Memberships expired');
    return { expiredCount: memberships.length, targetDate: today };
  } catch (error) {
    dependencies.logError({ error, targetDate: today }, 'Membership expired worker failed');
    throw error;
  }
}

async function defaultNotifyMembershipLifecycle(
  event: 'MEMBERSHIP_EXPIRING' | 'MEMBERSHIP_EXPIRED',
  membership: MembershipRecord
): Promise<void> {
  const customer = await findCustomerById(membership.customerId);
  if (customer === null || customer.email === null) return;

  const template = buildNotificationTemplate(event, {
    customerName: customer.name,
    endDate: membership.endDate,
    membershipRef: membership.businessId,
  });

  await sendTransactionalEmail({
    event,
    html: template.html,
    subject: template.subject,
    to: customer.email,
  });
}

const defaultDependencies: ExpiryWorkerDependencies = {
  expireActiveMembershipsEndingOn,
  findActiveMembershipsEndingOn,
  getToday: () => new Date().toISOString().slice(0, 10),
  logError: (payload, message) => logger.error(payload, message),
  logInfo: (payload, message) => logger.info(payload, message),
  notifyMembershipLifecycle: defaultNotifyMembershipLifecycle,
};

interface ExpiryWorkerDependencies {
  expireActiveMembershipsEndingOn: (endDate: string) => Promise<MembershipRecord[]>;
  findActiveMembershipsEndingOn: (endDate: string) => Promise<MembershipRecord[]>;
  getToday: () => string;
  logError: (payload: object, message: string) => void;
  logInfo: (payload: object, message: string) => void;
  notifyMembershipLifecycle?: (
    event: 'MEMBERSHIP_EXPIRING' | 'MEMBERSHIP_EXPIRED',
    membership: MembershipRecord
  ) => Promise<void>;
}
