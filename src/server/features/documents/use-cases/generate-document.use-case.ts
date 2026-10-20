import { AppError } from '@/server/common/errors/app-error';
import { env } from '@/server/config/env';
import { requireModerator } from '@/server/features/common/guards/require-moderator.guard';
import type { GqlContext } from '@/server/features/common/schemas/model/context.model';
import { buildDocumentPdf } from '@/server/features/documents/documents.pdf';
import {
  assertPdfText,
  documentNumber,
  formatIssuedOn,
} from '@/server/features/documents/documents.shared';
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
