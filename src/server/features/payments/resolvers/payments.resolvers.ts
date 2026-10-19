import { validateInput } from '@/server/features/common/middleware/validate-input';
import {
  createPaymentInputSchema,
  getPaymentInputSchema,
  listPaymentsInputSchema,
  markPaymentPaidInputSchema,
} from '@/server/features/payments/schemas/validators/payments.validators';
import { createPaymentUseCase } from '@/server/features/payments/use-cases/create-payment.use-case';
import {
  getPaymentUseCase,
  getPaymentsUseCase,
} from '@/server/features/payments/use-cases/get-payments.use-case';
import { markPaymentPaidUseCase } from '@/server/features/payments/use-cases/mark-payment-paid.use-case';
import type { GqlContext } from '@/server/features/common/schemas/model/context.model';
import type { PaymentRecord } from '@/server/features/payments/schemas/model/payments.model';

export const paymentsResolvers = {
  Query: {
    async payment(_parent: unknown, args: { id: string }, context: GqlContext) {
      const input = validateInput(getPaymentInputSchema, args);
      return getPaymentUseCase(input.id, context);
    },
    async payments(_parent: unknown, args: unknown, context: GqlContext) {
      const input = validateInput(listPaymentsInputSchema, args);
      return getPaymentsUseCase(input, context);
    },
  },
  Mutation: {
    async createPayment(_parent: unknown, args: ResolverArgs<unknown>, context: GqlContext) {
      const input = validateInput(createPaymentInputSchema, args.input);
      const payment = await createPaymentUseCase(input, context);

      return toPaymentDto(payment);
    },
    async markPaymentPaid(_parent: unknown, args: ResolverArgs<unknown>, context: GqlContext) {
      const input = validateInput(markPaymentPaidInputSchema, args.input);
      const payment = await markPaymentPaidUseCase(input, context);

      return toPaymentDto(payment);
    },
  },
};

function toPaymentDto(payment: PaymentRecord) {
  return {
    amount: payment.amount,
    businessId: payment.businessId,
    createdAt: payment.createdAt.toISOString(),
    currencyCode: payment.currencyCode,
    customerId: payment.customerId,
    dueDate: payment.dueDate,
    id: payment.id,
    membershipId: payment.membershipId,
    method: payment.method,
    notes: payment.notes,
    paidDate: payment.paidDate,
    status: payment.status,
    updatedAt: payment.updatedAt.toISOString(),
  };
}

interface ResolverArgs<TInput> {
  input: TInput;
}
