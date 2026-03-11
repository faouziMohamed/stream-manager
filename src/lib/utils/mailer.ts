/**
 * Shared mailer utility — wraps nodemailer using SMTP settings stored in DB.
 * Import this in any server-side module that needs to send email.
 */
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import {
  notificationEvents,
  notificationSettings,
} from "@/lib/db/tables/subscription-management.table";
import {
  getSmtpPassword,
  getSmtpSettings,
} from "@/lib/db/repositories/settings";
import { createLogger } from "@/lib/logger";
import { eq } from "drizzle-orm";

const logger = createLogger("mailer");

export interface MailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

/**
 * Send an email using the SMTP settings stored in the DB.
 * Always closes the transporter to avoid hanging connections in serverless.
 * Returns null on success, or an error message string on failure.
 */
export async function sendViaSMTP(mail: MailOptions): Promise<string | null> {
  const smtp = await getSmtpSettings();
  if (!smtp.host || !smtp.user) return "Configuration SMTP incomplète.";
  const password = await getSmtpPassword();
  if (!password) return "Mot de passe SMTP manquant.";

  try {
    const nodemailer = await import("nodemailer");
    const transportOptions = {
      host: smtp.host,
      port: smtp.port ?? 587,
      secure: smtp.secure ?? false,
      auth: { user: smtp.user, pass: password },
      pool: false,
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const transporter = nodemailer.createTransport(transportOptions as any);
    try {
      await transporter.sendMail({
        from: `"${smtp.senderName ?? "StreamManager"}" <${smtp.senderEmail ?? smtp.user}>`,
        ...mail,
      });
    } finally {
      transporter.close();
    }
    return null;
  } catch (err) {
    return err instanceof Error ? err.message : "Erreur inconnue";
  }
}

// ─── Notification event types ─────────────────────────────────────────────────

export type NotificationEventType =
  | "new_inquiry"
  | "payment_overdue"
  | "payment_paid"
  | "subscription_created"
  | "subscription_renewed"
  | "subscription_expiring";

export const NOTIFICATION_LABELS: Record<NotificationEventType, string> = {
  new_inquiry: "Nouveau message de contact",
  payment_overdue: "Paiement en retard",
  payment_paid: "Paiement reçu",
  subscription_created: "Abonnement créé",
  subscription_renewed: "Abonnement renouvelé",
  subscription_expiring: "Abonnement expirant bientôt",
};

/**
 * Check if a notification event type is enabled in DB settings.
 * Falls back to `true` if no row found (default-on).
 */
export async function isNotificationEnabled(
  event: NotificationEventType,
): Promise<boolean> {
  try {
    const [row] = await db
      .select()
      .from(notificationSettings)
      .where(eq(notificationSettings.event, event));
    return row?.enabled ?? true;
  } catch {
    return true;
  }
}

/**
 * Send a notification email if the event type is enabled.
 * Logs the attempt (success or failure) to the notification_events table.
 */
export async function sendNotification(
  event: NotificationEventType,
  mail: MailOptions,
): Promise<void> {
  const enabled = await isNotificationEnabled(event);
  if (!enabled) {
    logger.debug({ event }, "Notification skipped (disabled)");
    return;
  }

  const smtp = await getSmtpSettings();
  const to = mail.to || smtp.senderEmail || smtp.user || "";
  if (!to) {
    logger.warn(
      { event },
      "Notification skipped — no recipient email configured",
    );
    return;
  }

  const error = await sendViaSMTP({ ...mail, to });

  // Log the attempt
  try {
    await db.insert(notificationEvents).values({
      id: nanoid(),
      event,
      subject: mail.subject,
      toEmail: to,
      success: error === null,
      errorMessage: error ?? null,
    });
  } catch (logErr) {
    logger.error({ logErr }, "Failed to log notification event");
  }

  if (error) {
    logger.warn({ event, error }, "Notification email failed");
  } else {
    logger.info({ event, to }, "Notification email sent");
  }
}

/**
 * Get the admin email — senderEmail from SMTP settings, or smtp user as fallback.
 */
export async function getAdminEmail(): Promise<string | null> {
  const smtp = await getSmtpSettings();
  return smtp.senderEmail ?? smtp.user ?? null;
}
