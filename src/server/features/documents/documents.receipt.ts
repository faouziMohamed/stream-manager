import { buildDocumentPdf } from '@/server/features/documents/documents.pdf';
import {
  assertPdfText,
  documentNumber,
  formatIssuedOn,
} from '@/server/features/documents/documents.shared';

/**
 * The receipt attached to a "payment received" email.
 *
 * It is the same document the console can generate by hand, built from the one
 * payment that triggered the mail. `now` is injectable so tests can pin the
 * document number.
 */
export async function buildPaymentReceiptPdf(input: {
  customer: {
    businessId: string;
    email: string | null;
    language: string | null;
    name: string;
    phone: string | null;
  };
  payment: {
    amount: string;
    businessId: string;
    currencyCode: string;
  };
  now?: Date;
}): Promise<{ bytes: Uint8Array; filename: string }> {
  const { customer, payment, now = new Date() } = input;

  assertPdfText(customer.name, 'customer name');
  assertPdfText(payment.businessId, 'payment reference');

  const language = customer.language === 'en' ? 'en' : 'fr';
  const bytes = await buildDocumentPdf({
    currencyCode: payment.currencyCode,
    customer: { email: customer.email, name: customer.name, phone: customer.phone },
    issuedOn: formatIssuedOn(now, language),
    kind: 'receipt',
    language,
    lines: [{ amount: Number.parseFloat(payment.amount), label: payment.businessId }],
    number: documentNumber('receipt', customer.businessId, now),
  });

  return { bytes, filename: `receipt-${payment.businessId}.pdf` };
}
