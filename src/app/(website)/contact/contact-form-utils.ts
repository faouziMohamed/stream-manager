import { z } from 'zod';

import type { RichTextDocument } from '@/components/rich-text/rich-text-types';
import { extractPlainTextFromRichText } from '@/components/rich-text/rich-text-utils';

export const contactSchema = z.object({
  name: z.string().min(2, 'Nom requis'),
  email: z.email('Email invalide').optional().or(z.literal('')),
  phone: z.string().optional(),
  message: z
    .unknown()
    .refine(
      (value) => extractPlainTextFromRichText(value).length >= 10,
      'Message trop court (min. 10 caractères)'
    ),
});

export type ContactFormData = z.infer<typeof contactSchema>;

export type CreateInquiryInput = {
  email: string | null;
  message: RichTextDocument;
  name: string;
  phone: string | null;
};

export function toCreateInquiryInput(data: ContactFormData): CreateInquiryInput {
  return {
    name: data.name,
    email: data.email || null,
    phone: data.phone || null,
    message: data.message as RichTextDocument,
  };
}
