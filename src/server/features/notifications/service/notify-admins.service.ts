import { findAdminEmails } from '@/server/features/auth/repositories/auth-users.repository';
import { sendTransactionalEmail } from '@/server/features/notifications/service/notifications.service';
import { createLogger } from '@/server/config/logger.config';

const log = createLogger('notify-admins');

/**
 * An operator copy of a customer-facing event.
 *
 * The console's job is to tell the operator what happened while they were
 * looking elsewhere; the customer's own email is a separate send. Every
 * administrator receives one copy, and one failed address does not stop the
 * others. Callers treat the whole promise as fire-and-forget.
 */
export async function notifyAdmins(
  input: { event: string; html: string; subject: string },
  dependencies: NotifyAdminsDependencies = defaultDependencies
): Promise<void> {
  const recipients = await dependencies.findAdminEmails();

  const results = await Promise.allSettled(
    recipients.map((email) =>
      dependencies.send({
        event: input.event,
        html: input.html,
        subject: input.subject,
        to: email,
      })
    )
  );

  for (const result of results) {
    if (result.status === 'rejected') {
      log.warn({ err: result.reason }, 'Admin notification could not be sent');
    }
  }
}

type NotifyAdminsDependencies = {
  findAdminEmails: () => Promise<string[]>;
  send: (input: { event: string; html: string; subject: string; to: string }) => Promise<unknown>;
};

const defaultDependencies: NotifyAdminsDependencies = {
  findAdminEmails,
  send: sendTransactionalEmail,
};
