import { requireAdmin, requireAuth } from "./guards";
import { db } from "@/lib/db";
import {
  appSettings,
  contactInquiries,
  inquiryReplies,
  notificationEvents,
  notificationSettings,
  summaryLinks,
} from "@/lib/db/tables/subscription-management.table";
import { desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { env } from "@/lib/settings/env";
import { createLogger } from "@/lib/logger";
import { getDashboardStats } from "@/lib/db/repositories/analytics.repository";
import {
  getCloudinaryApiSecret,
  getCloudinarySettings,
  getSmtpSettings,
  saveCloudinarySettings,
  saveSmtpSettings,
} from "@/lib/db/repositories/settings.repository";
import {
  getAdminEmail,
  NOTIFICATION_LABELS,
  type NotificationEventType,
  sendNotification,
  sendViaSMTP,
} from "@/lib/utils/mailer";
import type { GraphQLContext } from "../context";

const logger = createLogger("settings-resolvers");

export const settingsResolvers = {
  Query: {
    appSetting: async (
      _: unknown,
      { key }: { key: string },
      ctx: GraphQLContext,
    ) => {
      requireAuth(ctx);
      const [setting] = await db
        .select()
        .from(appSettings)
        .where(eq(appSettings.key, key));
      return setting ?? null;
    },
    defaultCurrency: async () => {
      const [setting] = await db
        .select()
        .from(appSettings)
        .where(eq(appSettings.key, "defaultCurrency"));
      return setting?.value ?? "MAD";
    },
    smtpSettings: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      requireAdmin(ctx);
      return getSmtpSettings();
    },
    cloudinarySettings: async (
      _: unknown,
      __: unknown,
      ctx: GraphQLContext,
    ) => {
      requireAdmin(ctx);
      return getCloudinarySettings();
    },
    cloudinaryMedia: async (
      _: unknown,
      { folder }: { folder?: string },
      ctx: GraphQLContext,
    ) => {
      requireAdmin(ctx);
      const settings = await getCloudinarySettings();
      const apiSecret = await getCloudinaryApiSecret();
      if (!settings.cloudName || !settings.apiKey || !apiSecret) return [];
      try {
        const { v2: cloudinary } = await import("cloudinary");
        cloudinary.config({
          cloud_name: settings.cloudName,
          api_key: settings.apiKey,
          api_secret: apiSecret,
        });
        const prefix = folder ?? settings.folder ?? "streammanager";
        // api.resources with type:'upload' and prefix fetches ALL assets whose
        // public_id starts with the prefix — works recursively at any depth.
        const result = await cloudinary.api.resources({
          type: "upload",
          prefix,
          max_results: 200,
          resource_type: "image",
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (result.resources ?? []).map((r: any) => ({
          publicId: r.public_id,
          url: r.secure_url,
          format: r.format ?? "",
          width: r.width ?? 0,
          height: r.height ?? 0,
          bytes: r.bytes ?? 0,
          folder: r.folder ?? r.asset_folder ?? "",
          createdAt: r.created_at ?? "",
        }));
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        logger.error({ err, msg }, "cloudinaryMedia query failed");
        return [];
      }
    },
    summaryLinks: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      requireAdmin(ctx);
      return db.select().from(summaryLinks);
    },
    summaryByToken: async (_: unknown, { token }: { token: string }) => {
      const [link] = await db
        .select()
        .from(summaryLinks)
        .where(eq(summaryLinks.token, token));
      if (!link || !link.isActive) return null;
      if (link.expiresAt && link.expiresAt < new Date()) return null;
      const stats = await getDashboardStats();
      return { stats, showSensitiveInfo: link.showSensitiveInfo };
    },
    inquiries: async (
      _: unknown,
      { unreadOnly }: { unreadOnly?: boolean },
      ctx: GraphQLContext,
    ) => {
      requireAdmin(ctx);
      const rows = await db
        .select()
        .from(contactInquiries)
        .orderBy(desc(contactInquiries.createdAt));
      const filtered = unreadOnly ? rows.filter((r) => !r.isRead) : rows;
      // Attach replies for each inquiry
      return Promise.all(
        filtered.map(async (inquiry) => {
          const replies = await db
            .select()
            .from(inquiryReplies)
            .where(eq(inquiryReplies.inquiryId, inquiry.id))
            .orderBy(inquiryReplies.sentAt);
          return { ...inquiry, replies };
        }),
      );
    },
    inquiry: async (
      _: unknown,
      { id }: { id: string },
      ctx: GraphQLContext,
    ) => {
      requireAdmin(ctx);
      const [inquiry] = await db
        .select()
        .from(contactInquiries)
        .where(eq(contactInquiries.id, id));
      if (!inquiry) return null;
      const replies = await db
        .select()
        .from(inquiryReplies)
        .where(eq(inquiryReplies.inquiryId, id))
        .orderBy(inquiryReplies.sentAt);
      return { ...inquiry, replies };
    },
    notificationSettings: async (
      _: unknown,
      __: unknown,
      ctx: GraphQLContext,
    ) => {
      requireAdmin(ctx);
      const rows = await db.select().from(notificationSettings);
      // Ensure all event types have a row, using defaults for missing ones
      const map = new Map(rows.map((r) => [r.event, r]));
      return Object.entries(NOTIFICATION_LABELS).map(([event, label]) => ({
        event,
        label,
        enabled: map.get(event)?.enabled ?? true,
      }));
    },
    notificationHistory: async (
      _: unknown,
      { limit }: { limit?: number },
      ctx: GraphQLContext,
    ) => {
      requireAdmin(ctx);
      return db
        .select()
        .from(notificationEvents)
        .orderBy(desc(notificationEvents.createdAt))
        .limit(limit ?? 50);
    },
  },
  Mutation: {
    setAppSetting: async (
      _: unknown,
      { key, value }: { key: string; value: string },
      ctx: GraphQLContext,
    ) => {
      requireAdmin(ctx);
      await db
        .insert(appSettings)
        .values({ key, value })
        .onConflictDoUpdate({
          target: appSettings.key,
          set: { value, updatedAt: new Date() },
        });
      return { key, value };
    },
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
    setCloudinarySettings: async (
      _: unknown,
      {
        input,
      }: {
        input: {
          cloudName: string;
          apiKey: string;
          apiSecret?: string;
          uploadPreset?: string;
          folder?: string;
        };
      },
      ctx: GraphQLContext,
    ) => {
      requireAdmin(ctx);
      const result = await saveCloudinarySettings(input);
      logger.info("Cloudinary settings updated");
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
    testCloudinary: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      requireAdmin(ctx);
      const settings = await getCloudinarySettings();
      if (!settings.cloudName || !settings.apiKey) {
        return {
          success: false,
          message: "Configuration Cloudinary incomplète.",
          publicId: null,
          url: null,
        };
      }
      const apiSecret = await getCloudinaryApiSecret();
      if (!apiSecret) {
        return {
          success: false,
          message: "API Secret Cloudinary manquant.",
          publicId: null,
          url: null,
        };
      }
      try {
        const { v2: cloudinary } = await import("cloudinary");
        cloudinary.config({
          cloud_name: settings.cloudName,
          api_key: settings.apiKey,
          api_secret: apiSecret,
        });
        const testImageBase64 =
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
        const folder = settings.folder ?? "streammanager";
        const uploadResult = await cloudinary.uploader.upload(testImageBase64, {
          folder: `${folder}/tests`,
          public_id: `test_${Date.now()}`,
        });
        await cloudinary.uploader.destroy(uploadResult.public_id);
        logger.info(
          { publicId: uploadResult.public_id },
          "Test Cloudinary réussi (upload + suppression)",
        );
        return {
          success: true,
          message: "Upload et suppression réussis.",
          publicId: uploadResult.public_id,
          url: uploadResult.secure_url,
        };
      } catch (err) {
        logger.error({ err }, "Test Cloudinary échoué");
        const message = err instanceof Error ? err.message : "Erreur inconnue";
        return {
          success: false,
          message: `Échec : ${message}`,
          publicId: null,
          url: null,
        };
      }
    },
    uploadToCloudinary: async (
      _: unknown,
      { base64, filename }: { base64: string; filename?: string },
      ctx: GraphQLContext,
    ) => {
      requireAdmin(ctx);
      const settings = await getCloudinarySettings();
      if (!settings.cloudName || !settings.apiKey) {
        return {
          success: false,
          message: "Configuration Cloudinary incomplète.",
          publicId: null,
          url: null,
        };
      }
      const apiSecret = await getCloudinaryApiSecret();
      if (!apiSecret) {
        return {
          success: false,
          message: "API Secret Cloudinary manquant.",
          publicId: null,
          url: null,
        };
      }
      try {
        const { v2: cloudinary } = await import("cloudinary");
        cloudinary.config({
          cloud_name: settings.cloudName,
          api_key: settings.apiKey,
          api_secret: apiSecret,
        });
        const root = settings.folder ?? "streammanager";

        // filename may carry a sub-folder hint e.g. "logos/netflix.png"
        // We honour that hint so logos/ stays separate from tests/
        let publicId: string;
        if (filename) {
          const withoutExt = filename.replace(/\.[^.]+$/, "");
          // If caller already includes a sub-folder prefix (e.g. "logos/x"), respect it
          const hasSubFolder = withoutExt.includes("/");
          publicId = hasSubFolder
            ? `${root}/${withoutExt}_${Date.now()}`
            : `${root}/uploads/${withoutExt}_${Date.now()}`;
        } else {
          publicId = `${root}/uploads/upload_${Date.now()}`;
        }

        // Pass public_id only — no separate `folder` option to avoid double-nesting
        const uploadResult = await cloudinary.uploader.upload(base64, {
          public_id: publicId,
        });
        logger.info(
          { publicId: uploadResult.public_id },
          "Image uploadée sur Cloudinary",
        );
        return {
          success: true,
          message: "Image uploadée avec succès.",
          publicId: uploadResult.public_id,
          url: uploadResult.secure_url,
        };
      } catch (err) {
        logger.error({ err }, "Upload Cloudinary échoué");
        const message = err instanceof Error ? err.message : "Erreur inconnue";
        return {
          success: false,
          message: `Échec : ${message}`,
          publicId: null,
          url: null,
        };
      }
    },
    deleteFromCloudinary: async (
      _: unknown,
      { publicId }: { publicId: string },
      ctx: GraphQLContext,
    ) => {
      requireAdmin(ctx);
      const settings = await getCloudinarySettings();
      const apiSecret = await getCloudinaryApiSecret();
      if (!settings.cloudName || !settings.apiKey || !apiSecret) {
        return {
          success: false,
          message: "Configuration Cloudinary incomplète.",
        };
      }
      try {
        const { v2: cloudinary } = await import("cloudinary");
        cloudinary.config({
          cloud_name: settings.cloudName,
          api_key: settings.apiKey,
          api_secret: apiSecret,
        });
        const result = await cloudinary.uploader.destroy(publicId);
        if (result.result !== "ok") {
          return { success: false, message: `Cloudinary: ${result.result}` };
        }
        logger.info({ publicId }, "Image supprimée de Cloudinary");
        return { success: true, message: "Image supprimée avec succès." };
      } catch (err) {
        logger.error({ err }, "Suppression Cloudinary échouée");
        const message = err instanceof Error ? err.message : "Erreur inconnue";
        return { success: false, message: `Échec : ${message}` };
      }
    },
    replaceCloudinaryImage: async (
      _: unknown,
      {
        oldPublicId,
        base64,
        filename,
      }: { oldPublicId: string; base64: string; filename?: string },
      ctx: GraphQLContext,
    ) => {
      requireAdmin(ctx);
      const settings = await getCloudinarySettings();
      const apiSecret = await getCloudinaryApiSecret();
      if (!settings.cloudName || !settings.apiKey || !apiSecret) {
        return {
          success: false,
          message: "Configuration Cloudinary incomplète.",
          publicId: null,
          url: null,
        };
      }
      try {
        const { v2: cloudinary } = await import("cloudinary");
        cloudinary.config({
          cloud_name: settings.cloudName,
          api_key: settings.apiKey,
          api_secret: apiSecret,
        });
        // Upload new image first (keep old until success)
        const root = settings.folder ?? "streammanager";
        // Mirror the sub-folder of the old image so the replacement lands in the same section
        const oldSegments = oldPublicId.split("/");
        const oldSubFolder =
          oldSegments.length >= 3
            ? oldSegments.slice(1, -1).join("/") // e.g. "logos" from "streammanager/logos/x"
            : null;
        const baseName = filename
          ? filename.replace(/\.[^.]+$/, "")
          : `upload_${Date.now()}`;
        const newPublicId = oldSubFolder
          ? `${root}/${oldSubFolder}/${baseName}_${Date.now()}`
          : `${root}/uploads/${baseName}_${Date.now()}`;
        const uploadResult = await cloudinary.uploader.upload(base64, {
          public_id: newPublicId,
        });
        // Delete old image
        await cloudinary.uploader.destroy(oldPublicId);
        logger.info(
          { oldPublicId, newPublicId: uploadResult.public_id },
          "Image remplacée sur Cloudinary",
        );
        return {
          success: true,
          message: "Image remplacée avec succès.",
          publicId: uploadResult.public_id,
          url: uploadResult.secure_url,
        };
      } catch (err) {
        logger.error({ err }, "Remplacement Cloudinary échoué");
        const message = err instanceof Error ? err.message : "Erreur inconnue";
        return {
          success: false,
          message: `Échec : ${message}`,
          publicId: null,
          url: null,
        };
      }
    },
    createInquiry: async (
      _: unknown,
      {
        input,
      }: {
        input: {
          name: string;
          email?: string;
          phone?: string;
          message: string;
        };
      },
    ) => {
      try {
        await db.insert(contactInquiries).values({
          id: nanoid(),
          name: input.name,
          email: input.email ?? null,
          phone: input.phone ?? null,
          message: input.message,
        });

        // Notify admin — respects the new_inquiry notification toggle
        const adminEmail = await getAdminEmail();
        if (adminEmail) {
          const contactInfo = [
            input.email ? `E-mail : ${input.email}` : null,
            input.phone ? `Téléphone : ${input.phone}` : null,
          ]
            .filter(Boolean)
            .join("\n");

          await sendNotification("new_inquiry", {
            to: adminEmail,
            subject: `📩 Nouveau message de ${input.name} — StreamManager`,
            text: [
              `Vous avez reçu un nouveau message via le formulaire de contact.`,
              ``,
              `De : ${input.name}`,
              contactInfo,
              ``,
              `Message :`,
              input.message,
            ]
              .filter((l) => l !== null)
              .join("\n"),
            html: `
              <h2 style="margin:0 0 16px">Nouveau message de contact</h2>
              <table style="border-collapse:collapse;width:100%">
                <tr><td style="padding:6px 0;color:#666;width:120px">De</td><td style="padding:6px 0;font-weight:600">${input.name}</td></tr>
                ${input.email ? `<tr><td style="padding:6px 0;color:#666">E-mail</td><td style="padding:6px 0"><a href="mailto:${input.email}">${input.email}</a></td></tr>` : ""}
                ${input.phone ? `<tr><td style="padding:6px 0;color:#666">Téléphone</td><td style="padding:6px 0">${input.phone}</td></tr>` : ""}
              </table>
              <hr style="margin:16px 0;border:none;border-top:1px solid #eee"/>
              <p style="white-space:pre-wrap;margin:0">${input.message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
            `,
          });
        }

        return true;
      } catch (err) {
        logger.error({ err }, "Failed to save contact inquiry");
        return false;
      }
    },
    markInquiryRead: async (
      _: unknown,
      { id, isRead }: { id: string; isRead: boolean },
      ctx: GraphQLContext,
    ) => {
      requireAdmin(ctx);
      const [inquiry] = await db
        .update(contactInquiries)
        .set({ isRead })
        .where(eq(contactInquiries.id, id))
        .returning();
      const replies = await db
        .select()
        .from(inquiryReplies)
        .where(eq(inquiryReplies.inquiryId, id))
        .orderBy(inquiryReplies.sentAt);
      return { ...inquiry, replies };
    },
    replyToInquiry: async (
      _: unknown,
      { id, body }: { id: string; body: string },
      ctx: GraphQLContext,
    ) => {
      requireAdmin(ctx);
      // Fetch inquiry to get email + name
      const [inquiry] = await db
        .select()
        .from(contactInquiries)
        .where(eq(contactInquiries.id, id));
      if (!inquiry) throw new Error("Inquiry not found");

      // Save reply to DB
      const replyId = nanoid();
      const [reply] = await db
        .insert(inquiryReplies)
        .values({ id: replyId, inquiryId: id, body })
        .returning();

      // Mark as read automatically on reply
      await db
        .update(contactInquiries)
        .set({ isRead: true })
        .where(eq(contactInquiries.id, id));

      // Send email if contact provided an email address
      if (inquiry.email) {
        const error = await sendViaSMTP({
          to: inquiry.email,
          subject: `Re: Votre message — StreamManager`,
          text: body,
          html: `
            <p>Bonjour ${inquiry.email ? inquiry.name : ""},</p>
            <p style="white-space:pre-wrap">${body.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
            <hr style="margin:24px 0;border:none;border-top:1px solid #eee"/>
            <p style="color:#999;font-size:12px">Votre message original :</p>
            <blockquote style="border-left:3px solid #eee;margin:0;padding:0 0 0 12px;color:#666;font-size:13px">
              <p style="white-space:pre-wrap">${inquiry.message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
            </blockquote>
          `,
        });
        if (error) {
          logger.warn({ error, inquiryId: id }, "Failed to send reply email");
        } else {
          logger.info({ inquiryId: id, to: inquiry.email }, "Reply email sent");
        }
      }

      return reply;
    },
    deleteInquiry: async (
      _: unknown,
      { id }: { id: string },
      ctx: GraphQLContext,
    ) => {
      requireAdmin(ctx);
      await db.delete(contactInquiries).where(eq(contactInquiries.id, id));
      return true;
    },
    createSummaryLink: async (
      _: unknown,
      {
        label,
        showSensitiveInfo,
        expiresAt,
      }: { label?: string; showSensitiveInfo: boolean; expiresAt?: string },
      ctx: GraphQLContext,
    ) => {
      requireAdmin(ctx);
      const id = nanoid();
      const token = nanoid(16);
      const baseUrl = env.BETTER_AUTH_URL;
      const [link] = await db
        .insert(summaryLinks)
        .values({
          id,
          token,
          label: label ?? null,
          showSensitiveInfo,
          isActive: true,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
        })
        .returning();
      return { ...link, shareUrl: `${baseUrl}/s/${token}` };
    },
    deleteSummaryLink: async (
      _: unknown,
      { id }: { id: string },
      ctx: GraphQLContext,
    ) => {
      requireAdmin(ctx);
      await db.delete(summaryLinks).where(eq(summaryLinks.id, id));
      return true;
    },
    toggleSummaryLink: async (
      _: unknown,
      { id, isActive }: { id: string; isActive: boolean },
      ctx: GraphQLContext,
    ) => {
      requireAdmin(ctx);
      const [link] = await db
        .update(summaryLinks)
        .set({ isActive })
        .where(eq(summaryLinks.id, id))
        .returning();
      return { ...link, shareUrl: `${env.BETTER_AUTH_URL}/s/${link.token}` };
    },
    setNotificationSetting: async (
      _: unknown,
      { event, enabled }: { event: string; enabled: boolean },
      ctx: GraphQLContext,
    ) => {
      requireAdmin(ctx);
      await db
        .insert(notificationSettings)
        .values({ event, enabled })
        .onConflictDoUpdate({
          target: notificationSettings.event,
          set: { enabled, updatedAt: new Date() },
        });
      return {
        event,
        label: NOTIFICATION_LABELS[event as NotificationEventType] ?? event,
        enabled,
      };
    },
  },
  SummaryLink: {
    shareUrl: (parent: { token: string }) =>
      `${env.BETTER_AUTH_URL}/s/${parent.token}`,
  },
};
