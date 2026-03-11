'use client';

import {useQuery, useMutation, useQueryClient, type QueryKey} from '@tanstack/react-query';
import {gqlRequest} from '@/lib/graphql/client';
import {
    GET_PAYMENTS,
    UPDATE_PAYMENT,
    MARK_PAYMENT_PAID,
    type PaymentDto,
    type PaymentStatus,
    type UpdatePaymentInput,
} from '@/lib/graphql/operations/payments.operations';
import {clientLogger} from '@/lib/logger/client-logger';

const logger = clientLogger('use-payments-queries');

export const paymentKeys = {
    all: ['payments'] as QueryKey,
    filtered: (filters: { subscriptionId?: string; status?: PaymentStatus; fromDate?: string; toDate?: string }) =>
        ['payments', filters] as QueryKey,
    detail: (id: string) => ['payments', id] as QueryKey,
};

export function usePayments(
    filters?: { subscriptionId?: string; status?: PaymentStatus; fromDate?: string; toDate?: string },
    initialData?: PaymentDto[],
) {
    return useQuery({
        queryKey: paymentKeys.filtered(filters ?? {}),
        queryFn: () =>
            gqlRequest<{ payments: PaymentDto[] }>(GET_PAYMENTS, filters).then((r) => r.payments),
        initialData,
    });
}

export function useUpdatePayment() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({id, input}: { id: string; input: UpdatePaymentInput }) =>
            gqlRequest<{ updatePayment: PaymentDto }>(UPDATE_PAYMENT, {id, input}).then(
                (r) => r.updatePayment,
            ),
        onMutate: async ({id, input}) => {
            await qc.cancelQueries({queryKey: paymentKeys.all});
            const prev = qc.getQueryData<PaymentDto[]>(paymentKeys.all);
            qc.setQueryData<PaymentDto[]>(paymentKeys.all, (old) =>
                old?.map((p) => (p.id === id ? {...p, ...input} : p)) ?? [],
            );
            return {prev};
        },
        onError: (err, _, ctx) => {
            logger.error('updatePayment failed', err);
            if (ctx?.prev) qc.setQueryData(paymentKeys.all, ctx.prev);
        },
        onSettled: () => {
            qc.invalidateQueries({queryKey: paymentKeys.all});
            qc.invalidateQueries({queryKey: ['dashboardStats']});
        },
    });
}

export function useMarkPaymentPaid() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({id, paidDate}: { id: string; paidDate?: string }) =>
            gqlRequest<{ markPaymentPaid: PaymentDto }>(MARK_PAYMENT_PAID, {id, paidDate}).then(
                (r) => r.markPaymentPaid,
            ),
        onMutate: async ({id}) => {
            await qc.cancelQueries({queryKey: paymentKeys.all});
            const prev = qc.getQueryData<PaymentDto[]>(paymentKeys.all);
            qc.setQueryData<PaymentDto[]>(paymentKeys.all, (old) =>
                old?.map((p) =>
                    p.id === id
                        ? {...p, status: 'paid' as PaymentStatus, paidDate: new Date().toISOString().slice(0, 10)}
                        : p,
                ) ?? [],
            );
            return {prev};
        },
        onError: (err, _, ctx) => {
            logger.error('markPaymentPaid failed', err);
            if (ctx?.prev) qc.setQueryData(paymentKeys.all, ctx.prev);
        },
        onSettled: () => {
            qc.invalidateQueries({queryKey: paymentKeys.all});
            qc.invalidateQueries({queryKey: ['dashboardStats']});
        },
    });
}
