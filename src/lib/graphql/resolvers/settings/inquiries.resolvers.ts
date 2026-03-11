import { requireAdmin } from "@/lib/graphql/resolvers/guards";
import { db } from "@/lib/db";
import {
  contactInquiries,
  inquiryReplies,
} from "@/lib/db/tables/subscription-management.table";
import { desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { createLogger } from "@/lib/logger";
import {
  getAdminEmail,
  sendNotification,
  sendViaSMTP,
} from "@/lib/utils/mailer";
import type { GraphQLContext } from "@/lib/graphql/context";

const logger = createLogger("inquiries-resolvers");

export const inquiriesQueryResolvers = {
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
  inquiry: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
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
};

export const inquiriesMutationResolvers = {
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

      logger.info({ name: input.name }, "Contact inquiry created");
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
    logger.info({ id, isRead }, "Inquiry read status updated");
    return { ...inquiry, replies };
  },
  replyToInquiry: async (
    _: unknown,
    { id, body }: { id: string; body: string },
    ctx: GraphQLContext,
  ) => {
    requireAdmin(ctx);
    const [inquiry] = await db
      .select()
      .from(contactInquiries)
      .where(eq(contactInquiries.id, id));
    if (!inquiry) throw new Error("Inquiry not found");

    const replyId = nanoid();
    const [reply] = await db
      .insert(inquiryReplies)
      .values({ id: replyId, inquiryId: id, body })
      .returning();

    await db
      .update(contactInquiries)
      .set({ isRead: true })
      .where(eq(contactInquiries.id, id));

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

    logger.info({ id, replyId }, "Reply sent to inquiry");
    return reply;
  },
  deleteInquiry: async (
    _: unknown,
    { id }: { id: string },
    ctx: GraphQLContext,
  ) => {
    requireAdmin(ctx);
    await db.delete(contactInquiries).where(eq(contactInquiries.id, id));
    logger.info({ id }, "Inquiry deleted");
    return true;
  },
};
