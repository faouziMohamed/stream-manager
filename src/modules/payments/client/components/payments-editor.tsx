'use client';

import { useState } from 'react';
import { AlertCircle, CheckCircle2, Clock, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ConfirmDialog } from '@/components/console/confirm-dialog';
import {
  useMarkPaymentPaid,
  usePayments,
  useUpdatePayment,
} from '@/lib/hooks/queries/use-payments.queries';
import type { PaymentDto } from '@/lib/graphql/operations/payments.operations';
import { formatCurrency, cn } from '@/lib/utils/helpers';
import {
  paymentStatusColor,
  paymentStatusLabel,
  overdueRowClass,
} from '@/lib/utils/status-colors';

interface Props {
  initialData?: PaymentDto[];
}

// Filter pill labels
const FILTERS = [
  { key: 'all', label: 'Tous', cls: '' },
  { key: 'unpaid', label: 'En attente', cls: 'data-[active=true]:bg-slate-700 data-[active=true]:text-white' },
  { key: 'overdue', label: 'En retard', cls: 'data-[active=true]:bg-red-600 data-[active=true]:text-white border-red-300 text-red-600 dark:border-red-700 dark:text-red-400' },
  { key: 'paid', label: 'Payé', cls: 'data-[active=true]:bg-emerald-600 data-[active=true]:text-white border-emerald-300 text-emerald-600 dark:border-emerald-700 dark:text-emerald-400' },
] as const;

export function PaymentsEditor({ initialData }: Props) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [confirmPayment, setConfirmPayment] = useState<PaymentDto | null>(null);

  const { data: allPayments = [] } = usePayments(initialData);
  const markPaid = useMarkPaymentPaid();
  const updatePayment = useUpdatePayment();

  const handleMarkPaid = async () => {
    if (!confirmPayment) return;
    await markPaid.mutateAsync({ id: confirmPayment.id });
    setConfirmPayment(null);
  };

  const handleMarkUnpaid = async (payment: PaymentDto) => {
    await updatePayment.mutateAsync({
      id: payment.id,
      input: { status: 'unpaid', paidDate: undefined },
    });
  };

  const payments =
    statusFilter === 'all'
      ? allPayments
      : allPayments.filter((p) => p.status === statusFilter);

  const overdueCount = allPayments.filter((p) => p.status === 'overdue').length;
  const unpaidCount = allPayments.filter((p) => p.status === 'unpaid').length;
  const paidCount = allPayments.filter((p) => p.status === 'paid').length;
  const totalOverdueAmount = allPayments
    .filter((p) => p.status === 'overdue')
    .reduce((s, p) => s + Number(p.amount), 0);

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
              <CreditCard className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Paiements</h1>
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            Suivez et gérez les paiements de vos abonnements
          </p>
        </div>
      </div>

      {/* ── Overdue banner ── */}
      {overdueCount > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-800/50 dark:bg-red-950/20">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
          <div className="flex-1">
            <span className="text-sm font-semibold text-red-700 dark:text-red-300">
              {overdueCount} paiement{overdueCount > 1 ? 's' : ''} en retard
            </span>
            <span className="text-muted-foreground ml-2 text-sm">
              — total dû:{' '}
              <span className="font-semibold text-red-700 dark:text-red-300">
                {formatCurrency(totalOverdueAmount, allPayments.find((p) => p.status === 'overdue')?.currencyCode ?? 'MAD')}
              </span>
            </span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs text-red-600 hover:text-red-700 dark:text-red-400"
            onClick={() => setStatusFilter('overdue')}
          >
            Afficher
          </Button>
        </div>
      )}

      {/* ── Summary chips ── */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-1.5 text-sm">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <span className="font-semibold text-emerald-700 tabular-nums dark:text-emerald-400">{paidCount}</span>
          <span className="text-muted-foreground">payés</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm">
          <Clock className="text-muted-foreground h-4 w-4" />
          <span className="font-semibold tabular-nums">{unpaidCount}</span>
          <span className="text-muted-foreground">en attente</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <span className="font-semibold text-red-600 tabular-nums dark:text-red-400">{overdueCount}</span>
          <span className="text-muted-foreground">en retard</span>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map(({ key, label, cls }) => {
          let count: number | null = null;
          switch (key) {
            case 'overdue': {
              count = overdueCount;
              break;
            }
            case 'unpaid': {
              count = unpaidCount;
              break;
            }
            case 'paid': {
              count = paidCount;
              break;
            }
            default: {
              count = null;
              break;
            }
          }

          let countCls = 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
          switch (key) {
            case 'overdue': {
              countCls = 'bg-red-200 text-red-700 dark:bg-red-900 dark:text-red-300';
              break;
            }
            case 'paid': {
              countCls =
                'bg-emerald-200 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300';
              break;
            }
            default: {
              break;
            }
          }
          return (
            <button
              key={key}
              type="button"
              data-active={statusFilter === key}
              onClick={() => setStatusFilter(key)}
              className={cn(
                'flex items-center gap-1.5 rounded-full border px-3.5 py-1 text-sm font-medium transition-colors',
                statusFilter === key
                  ? 'bg-primary border-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:border-foreground/30 border-border',
                cls
              )}
            >
              {label}
              {count !== null && count > 0 && (
                <span className={cn('rounded-full px-1.5 py-0.5 text-xs font-bold', countCls)}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {payments.length === 0 ? (
        <Card>
          <CardContent className="text-muted-foreground py-12 text-center">
            Aucun paiement trouvé.
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Échéance</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date de paiement</TableHead>
                <TableHead className="w-36" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => {
                const isOverdue = payment.status === 'overdue';
                const isPaid = payment.status === 'paid';
                const statusCls = paymentStatusColor[payment.status] ?? paymentStatusColor.unpaid;
                const statusLbl = paymentStatusLabel[payment.status] ?? payment.status;
                return (
                  <TableRow
                    key={payment.id}
                    className={cn(isOverdue && overdueRowClass)}
                  >
                    <TableCell className="font-medium">
                      {payment.subscription?.client?.name ?? '—'}
                    </TableCell>
                    <TableCell
                      className={cn(
                        'text-sm',
                        isOverdue && 'font-semibold text-red-600 dark:text-red-400'
                      )}
                    >
                      {payment.dueDate}
                    </TableCell>
                    <TableCell
                      className={cn(
                        'font-semibold tabular-nums',
                        isOverdue && 'text-red-600 dark:text-red-400',
                        isPaid && 'text-emerald-600 dark:text-emerald-400'
                      )}
                    >
                      {formatCurrency(payment.amount, payment.currencyCode)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          'border text-xs',
                          statusCls,
                          isOverdue && 'animate-pulse'
                        )}
                      >
                        {isOverdue && <AlertCircle className="mr-1 h-3 w-3" />}
                        {isPaid && <CheckCircle2 className="mr-1 h-3 w-3" />}
                        {statusLbl}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {payment.paidDate ?? '—'}
                    </TableCell>
                    <TableCell>
                      {isPaid ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-muted-foreground h-7 text-xs"
                          onClick={() => handleMarkUnpaid(payment)}
                        >
                          Annuler
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          className="h-7 gap-1 bg-emerald-600 text-xs text-white hover:bg-emerald-700"
                          onClick={() => setConfirmPayment(payment)}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Marquer payé
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmPayment}
        onOpenChange={(o) => !o && setConfirmPayment(null)}
        title="Confirmer le paiement"
        description={`Marquer le paiement de ${confirmPayment ? formatCurrency(confirmPayment.amount, confirmPayment.currencyCode) : ''} comme payé ?`}
        confirmLabel="Confirmer le paiement"
        onConfirm={handleMarkPaid}
        loading={markPaid.isPending}
      />
    </div>
  );
}
