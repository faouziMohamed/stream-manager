import { AppError } from '@/server/common/errors/app-error';
import { env } from '@/server/config/env';
import { requireModerator } from '@/server/features/common/guards/require-moderator.guard';
import type { GqlContext } from '@/server/features/common/schemas/model/context.model';
import { buildDocumentPdf } from '@/server/features/documents/documents.pdf';
import { findCustomerById } from '@/server/features/customers/repositories/customers.repository';
import { findMembershipsByIds } from '@/server/features/memberships/repositories/memberships.repository';
import { findPaymentsByIds } from '@/server/features/payments/repositories/payments.repository';
import { findPlansByIds } from '@/server/features/plans/repositories/plans.repository';

/**
 * One document, built from the payments the operator selected.
 *
 * A bill and a receipt are the same layout answering opposite questions, so
 * the kind is checked against the rows rather than trusted: a receipt of an
 * unpaid payment would be a false document, and a bill of a settled one is
 * noise. Anything mismatched is refused instead of quietly filtered, because
 * a silently shorter document is worse than an error.
 */
export async function generateDocumentUseCase(
  input: GenerateDocumentInput,
  context: GqlContext,
  dependencies: GenerateDocumentDependencies = defaultDependencies
) {
  // Customers are staff-only data (their reads require a moderator); a
  // document carrying their name, e-mail and phone must not be available to
  // a plain user session that can only list payment ids.
  requireModerator(context);

  if (input.paymentIds.length === 0) {
    throw new AppError('Select at least one payment', 400, 'DOCUMENT_EMPTY');
  }

  const customer = await dependencies.findCustomerById(input.customerId);

  if (customer === null) {
    throw new AppError('Customer not found', 404, 'CUSTOMER_NOT_FOUND');
  }

  const payments = await dependencies.findPaymentsByIds(input.paymentIds);

  if (payments.length !== input.paymentIds.length) {
    throw new AppError('Some payments no longer exist', 404, 'PAYMENT_NOT_FOUND');
  }

  if (payments.some((payment) => payment.customerId !== customer.id)) {
    throw new AppError('A payment belongs to another customer', 400, 'DOCUMENT_MISMATCH');
  }

  const settled = payments.every((payment) => payment.status === 'paid');
  const unsettled = payments.every(
    (payment) => payment.status === 'unpaid' || payment.status === 'overdue'
  );

  if (input.kind === 'receipt' && !settled) {
    throw new AppError(
      'A receipt can only cover payments that are paid',
      400,
      'DOCUMENT_STATUS_MISMATCH'
    );
  }

  if (input.kind === 'bill' && !unsettled) {
    throw new AppError(
      'A bill can only cover payments that are still owed',
      400,
      'DOCUMENT_STATUS_MISMATCH'
    );
  }

  // A total only means something in one currency. Mixing MAD and EUR would
  // sum unlike units and label the result with whichever came first.
  const currencies = new Set(payments.map((payment) => payment.currencyCode));

  if (currencies.size > 1) {
    throw new AppError(
      'A document cannot mix currencies — select payments in one currency',
      400,
      'DOCUMENT_MIXED_CURRENCY'
    );
  }

  // Two queries for the whole batch: a fifty-line document must not issue a
  // hundred round trips against a remote database.
  const membershipIds = [...new Set(payments.map((payment) => payment.membershipId))];
  const memberships = await dependencies.findMembershipsByIds(membershipIds);
  const plans = await dependencies.findPlansByIds([
    ...new Set(memberships.map((membership) => membership.planId)),
  ]);
  const planNameById = new Map(plans.map((plan) => [plan.id, plan.name]));
  const planByMembershipId = new Map(
    memberships.map((membership) => [membership.id, membership.planId])
  );

  const lines = payments.map((payment) => {
    const planId = planByMembershipId.get(payment.membershipId);
    const planName = planId === undefined ? undefined : planNameById.get(planId);

    return {
      amount: Number.parseFloat(payment.amount),
      label: planName === undefined ? payment.businessId : `${planName} · ${payment.businessId}`,
    };
  });

  for (const payment of payments) {
    const planId = planByMembershipId.get(payment.membershipId);
    const planName = planId === undefined ? undefined : planNameById.get(planId);

    assertPdfText(customer.name, 'customer name');
    if (planName !== undefined) assertPdfText(planName, 'plan name');
    assertPdfText(payment.businessId, 'payment reference');
  }

  const language = customer.language === 'en' ? 'en' : 'fr';
  const issuedOn = formatIssuedOn(new Date(), language);

  const pdf = await buildDocumentPdf({
    currencyCode: payments[0]?.currencyCode ?? env.DEFAULT_CURRENCY,
    customer: { email: customer.email, name: customer.name, phone: customer.phone },
    issuedOn,
    kind: input.kind,
    language,
    lines,
    number: documentNumber(input.kind, customer.businessId, new Date()),
  });

  return {
    bytes: pdf,
    filename: `${input.kind}-${customer.businessId}.pdf`,
  };
}

/**
 * Kind, customer, date and second.
 *
 * A document number has to be different each time it is issued, and nothing
 * here keeps a counter; the second-level stamp is enough to tell two batches
 * apart while staying readable and traceable to a customer and a day.
 */
function documentNumber(kind: 'bill' | 'receipt', businessId: string, at: Date): string {
  const stamp = [
    at.getFullYear(),
    String(at.getMonth() + 1).padStart(2, '0'),
    String(at.getDate()).padStart(2, '0'),
  ].join('');
  const clock = [
    String(at.getHours()).padStart(2, '0'),
    String(at.getMinutes()).padStart(2, '0'),
    String(at.getSeconds()).padStart(2, '0'),
  ].join('');

  return `${kind === 'bill' ? 'B' : 'R'}-${businessId}-${stamp}-${clock}`;
}

/**
 * The PDF's built-in fonts are WinAnsi and throw on anything outside it.
 *
 * Rather than crash mid-document (or print question marks where a customer's
 * name should be), the characters are checked first and the operator is told
 * what to fix. Moroccan names are frequently Arabic; a document that silently
 * mangles or refuses one is a support call either way, and an explicit message
 * is the honest version.
 */
function assertPdfText(value: string, field: string) {
  // Printable WinAnsi range plus the handful of typographic marks it carries.
  const unsupported = [...value].filter((character) => {
    const code = character.codePointAt(0) ?? 0;

    return code > 0x7F && !WIN_ANSI_EXTRAS.has(code);
  });

  if (unsupported.length > 0) {
    throw new AppError(
      `The ${field} contains characters this PDF cannot render (${unsupported.slice(0, 3).join(' ')}). Use Latin script for documents.`,
      422,
      'DOCUMENT_UNRENDERABLE_TEXT'
    );
  }
}

/** WinAnsi accepts Latin-1 plus these code points above 0xFF. */
const WIN_ANSI_EXTRAS = new Set(
  [
    '20AC',
    '201A',
    '0192',
    '201E',
    '2026',
    '2020',
    '2021',
    '02C6',
    '2030',
    '0160',
    '2039',
    '0152',
    '017D',
    '2018',
    '2019',
    '201C',
    '201D',
    '2022',
    '2013',
    '2014',
    '02DC',
    '2122',
    '0161',
    '203A',
    '0153',
    '017E',
    '0178',
  ].map((hex) => Number.parseInt(hex, 16))
);

function formatIssuedOn(date: Date, language: 'en' | 'fr'): string {
  return new Intl.DateTimeFormat(language === 'fr' ? 'fr-FR' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export type GenerateDocumentInput = {
  customerId: string;
  kind: 'bill' | 'receipt';
  paymentIds: string[];
};

type CustomerRecord = Awaited<ReturnType<typeof findCustomerById>>;
type PaymentRecord = Awaited<ReturnType<typeof findPaymentsByIds>>[number];
type MembershipRecord = Awaited<ReturnType<typeof findMembershipsByIds>>[number];
type PlanRecord = Awaited<ReturnType<typeof findPlansByIds>>[number];

interface GenerateDocumentDependencies {
  findCustomerById: (id: string) => Promise<NonNullable<CustomerRecord> | null>;
  findMembershipsByIds: (ids: string[]) => Promise<MembershipRecord[]>;
  findPaymentsByIds: (ids: string[]) => Promise<PaymentRecord[]>;
  findPlansByIds: (ids: string[]) => Promise<PlanRecord[]>;
}

const defaultDependencies: GenerateDocumentDependencies = {
  findCustomerById,
  findMembershipsByIds,
  findPaymentsByIds,
  findPlansByIds,
};
