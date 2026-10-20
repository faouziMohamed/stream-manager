import nodemailer from 'nodemailer';

import { AppError } from '@/server/common/errors/app-error';
import { createResourceId } from '@/server/common/utils/resource-id';
import { createLogger } from '@/server/config/logger.config';
import { env } from '@/server/config/env';
import { logNotificationEvent } from '@/server/features/notifications/repositories/notifications.repository';

let cachedTransporter: nodemailer.Transporter | null = null;
let cachedTransportFingerprint: string | null = null;
const log = createLogger('notifications-service');

// Transactional email is configured entirely from the environment. When SMTP
// is not configured (or in tests), sending is skipped rather than failing the
// business operation that triggered it — a payment must still record even if
// the receipt email can't go out.
export async function sendTransactionalEmail(
  input: TransactionalEmailInput,
  dependencies: NotificationsDependencies = defaultDependencies
) {
  if (env.NODE_ENV === 'test') {
    log.info({ event: input.event, recipient: input.to }, 'Notification email skipped in test env');
    return { skipped: true };
  }

  const config = resolveSmtpConfig(dependencies);

  if (config === null) {
    log.warn({ event: input.event }, 'SMTP not configured; skipping notification email');
    return { skipped: true };
  }

  const transportFingerprint = JSON.stringify(config);

  if (cachedTransporter === null || cachedTransportFingerprint !== transportFingerprint) {
    cachedTransporter = dependencies.createTransport({
      auth: {
        pass: config.password,
        user: config.user,
      },
      host: config.host,
      port: config.port,
      secure: config.secure,
    });
    cachedTransportFingerprint = transportFingerprint;
  }

  try {
    await cachedTransporter.sendMail({
      attachments: input.attachments,
      from: `${config.fromName} <${config.fromAddress}>`,
      html: input.html,
      subject: input.subject,
      to: input.to,
    });

    await dependencies.logNotificationEvent({
      event: input.event,
      id: createResourceId('nte'),
      recipient: input.to,
      status: 'sent',
    });

    return { skipped: false };
  } catch (error) {
    await dependencies.logNotificationEvent({
      errorMessage: error instanceof Error ? error.message : 'Unknown notification error',
      event: input.event,
      id: createResourceId('nte'),
      recipient: input.to,
      status: 'failed',
    });

    throw new AppError('Failed to send email', 500, 'NOTIFICATION_SEND_FAILED');
  }
}

function resolveSmtpConfig(dependencies: NotificationsDependencies): ResolvedSmtpConfig | null {
  const config = dependencies.env;

  if (
    config.SMTP_HOST === undefined ||
    config.SMTP_USER === undefined ||
    config.SMTP_PASSWORD === undefined ||
    config.SMTP_PORT === undefined ||
    config.SMTP_FROM_ADDRESS === undefined ||
    config.SMTP_FROM_NAME === undefined
  ) {
    return null;
  }

  return {
    fromAddress: config.SMTP_FROM_ADDRESS,
    fromName: config.SMTP_FROM_NAME,
    host: config.SMTP_HOST,
    password: config.SMTP_PASSWORD,
    port: config.SMTP_PORT,
    secure: config.SMTP_SECURE ?? false,
    user: config.SMTP_USER,
  };
}

const defaultDependencies: NotificationsDependencies = {
  createTransport: nodemailer.createTransport,
  env,
  logNotificationEvent,
};

export interface EmailAttachment {
  content: Buffer;
  contentType?: string;
  filename: string;
}

interface TransactionalEmailInput {
  attachments?: EmailAttachment[];
  event: string;
  html: string;
  subject: string;
  to: string;
}

interface ResolvedSmtpConfig {
  fromAddress: string;
  fromName: string;
  host: string;
  password: string;
  port: number;
  secure: boolean;
  user: string;
}

interface NotificationsDependencies {
  createTransport: typeof nodemailer.createTransport;
  env: typeof env;
  logNotificationEvent: typeof logNotificationEvent;
}
