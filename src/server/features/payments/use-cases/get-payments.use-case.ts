import { paginationMeta } from '@/server/common/utils/pagination';
import { requireAuth } from '@/server/features/common/guards/require-auth.guard';
import type { GqlContext } from '@/server/features/common/schemas/model/context.model';
import {
  findPaymentById,
  findPayments,
} from '@/server/features/payments/repositories/payments.repository';
import type {
  PaymentRecord,
  PaymentStatus,
} from '@/server/features/payments/schemas/model/payments.model';

export async function getPaymentsUseCase(
  input: GetPaymentsInput,
  context: GqlContext,
  dependencies: GetPaymentsDependencies = defaultDependencies
) {
  requireAuth(context);

  const result = await dependencies.findPayments(input);

  return {
    items: result.items.map((item) => toPaymentDto(item)),
    pageInfo: paginationMeta(result.total, input.page, input.pageSize),
  };
}

export async function getPaymentUseCase(
  id: string,
  context: GqlContext,
  dependencies: GetPaymentDependencies = defaultGetPaymentDependencies
) {
  requireAuth(context);

  const payment = await dependencies.findPaymentById(id);
  return payment === null ? null : toPaymentDto(payment);
}

interface GetPaymentsInput {
  customerId?: string;
  dueFrom?: string;
  dueTo?: string;
  membershipId?: string;
  /** `asc` for a collection worklist, `desc` (default) for the newest first. */
  order?: 'asc' | 'desc';
  page: number;
  pageSize: number;
  status?: PaymentStatus;
}

interface FindPaymentsResult {
  items: PaymentRecord[];
  total: number;
}

interface GetPaymentsDependencies {
  findPayments: (input: GetPaymentsInput) => Promise<FindPaymentsResult>;
}

interface GetPaymentDependencies {
  findPaymentById: (id: string) => Promise<PaymentRecord | null>;
}

function toPaymentDto(payment: PaymentRecord) {
  return {
    amount: payment.amount,
    businessId: payment.businessId,
    createdAt: toIsoTimestamp(payment.createdAt),
    currencyCode: payment.currencyCode,
    customerId: payment.customerId,
    dueDate: payment.dueDate,
    id: payment.id,
    membershipId: payment.membershipId,
    method: payment.method,
    notes: payment.notes,
    paidDate: payment.paidDate,
    status: payment.status,
    updatedAt: toIsoTimestamp(payment.updatedAt),
  };
}

function toIsoTimestamp(value: Date | string): string {
  if (typeof value === 'string') {
    return value;
  }

  return value.toISOString();
}

const defaultDependencies: GetPaymentsDependencies = {
  findPayments,
};

const defaultGetPaymentDependencies: GetPaymentDependencies = {
  findPaymentById,
};
