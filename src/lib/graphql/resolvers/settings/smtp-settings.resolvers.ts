import { requireAdmin } from "@/lib/graphql/resolvers/guards";
import { createLogger } from "@/lib/logger";
import {
  getSmtpSettings,
  saveSmtpSettings,
} from "@/lib/db/repositories/settings";
import { sendViaSMTP } from "@/lib/utils/mailer";
import type { GraphQLContext } from "@/lib/graphql/context";

const logger = createLogger("smtp-settings-resolvers");

export const smtpSettingsQueryResolvers = {
  smtpSettings: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
    requireAdmin(ctx);
    return getSmtpSettings();
  },
};

export const smtpSettingsMutationResolvers = {
  setSmtpSettings: async (
    _: unknown,
    {
      input,
    }: {
      input: {
        host: string;
        port: number;
        secure: boolean;
        user: string;
        password?: string;
        senderEmail: string;
        senderName: string;
      };
    },
    ctx: GraphQLContext,
  ) => {
    requireAdmin(ctx);
    const result = await saveSmtpSettings(input);
    logger.info("SMTP settings updated");
    return result;
  },
  testSmtp: async (
    _: unknown,
    { toEmail }: { toEmail: string },
    ctx: GraphQLContext,
  ) => {
    requireAdmin(ctx);
    const error = await sendViaSMTP({
      to: toEmail,
      subject: "Test SMTP — StreamManager",
      text: "Ceci est un e-mail de test envoyé par StreamManager pour vérifier la configuration SMTP.",
      html: "<p>Ceci est un e-mail de test envoyé par <strong>StreamManager</strong> pour vérifier la configuration SMTP.</p>",
    });
    if (error) {
      logger.error({ error }, "Test SMTP échoué");
      return { success: false, message: `Échec : ${error}` };
    }
    logger.info({ toEmail }, "Test SMTP envoyé");
    return { success: true, message: `E-mail de test envoyé à ${toEmail}` };
  },
};
