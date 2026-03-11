import type { Metadata } from "next";
import { db } from "@/lib/db";
import {
  contactInquiries,
  inquiryReplies,
} from "@/lib/db/tables/subscription-management.table";
import { desc, eq } from "drizzle-orm";
import { InquiriesEditor } from "@/components/console/cms/inquiries-editor";
import type { InquiryDto } from "@/lib/graphql/operations/settings.operations";

export const metadata: Metadata = { title: "Messages — StreamManager" };

export default async function InquiriesPage() {
  const rows = await db
    .select()
    .from(contactInquiries)
    .orderBy(desc(contactInquiries.createdAt));

  const inquiries: InquiryDto[] = await Promise.all(
    rows.map(async (inquiry) => {
      const replies = await db
        .select()
        .from(inquiryReplies)
        .where(eq(inquiryReplies.inquiryId, inquiry.id))
        .orderBy(inquiryReplies.sentAt);
      return {
        ...inquiry,
        email: inquiry.email ?? null,
        phone: inquiry.phone ?? null,
        replies: replies.map((r) => ({
          ...r,
          sentAt: r.sentAt.toISOString(),
        })),
        createdAt: inquiry.createdAt.toISOString(),
      };
    }),
  );

  return <InquiriesEditor initialData={inquiries} />;
}
