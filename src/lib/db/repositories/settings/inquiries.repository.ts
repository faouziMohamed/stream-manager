import { db } from "@/lib/db";
import { contactInquiries } from "@/lib/db/tables/subscription-management.table";
import { nanoid } from "nanoid";
import { createLogger } from "@/lib/logger";

const logger = createLogger("inquiries-repository");

export type CreateInquiryInput = {
  name: string;
  email?: string | null;
  phone?: string | null;
  message: string;
};

export async function createContactInquiry(input: CreateInquiryInput) {
  try {
    await db.insert(contactInquiries).values({
      id: nanoid(),
      name: input.name,
      email: input.email ?? null,
      phone: input.phone ?? null,
      message: input.message,
    });
    logger.info({ name: input.name }, "Contact inquiry created");
    return true;
  } catch (err) {
    logger.error({ err }, "Failed to save contact inquiry");
    return false;
  }
}
