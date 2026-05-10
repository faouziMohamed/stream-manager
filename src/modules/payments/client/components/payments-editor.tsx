'use client';

import { useState } from 'react';
import type { ElementType } from 'react';
import { AlertCircle, CheckCircle2, Clock } from 'lucide-react';
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
import { useClients } from '@/lib/hooks/queries/use-clients.queries';
import { useSubscriptions } from '@/lib/hooks/queries/use-subscriptions.queries';
import type { PaymentDto } from '@/lib/graphql/operations/payments.operations';
import { formatCurrency } from '@/lib/utils/helpers';

const statusConfig: Record<
  string,
  {
    label: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    icon: ElementType;
  }
> = {
  paid: { label: 'Payé', variant: 'default', icon: CheckCircle2 },
  unpaid: { label: 'En attente', variant: 'outline', icon: Clock },
  overdue: { label: 'En retard', variant: 'destructive', icon: AlertCircle },
};

interface Props {
  initialData?: PaymentDto[];
}

export function PaymentsEditor({ initialData }: Props) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [confirmPayment, setConfirmPayment] = useState<PaymentDto | null>(null);

  const { data: payments = [] } = usePayments(
    statusFilter === 'all' ? undefined : { status: statusFilter as 'paid' | 'unpaid' | 'overdue' },
    initialData
  );
  const { data: subscriptions = [] } = useSubscriptions();
  const { data: clients = [] } = useClients();
  const markPaid = useMarkPaymentPaid();
  const updatePayment = useUpdatePayment();

  const getClientName = (subscriptionId: string) => {
    const sub = subscriptions.find((s) => s.id === subscriptionId);
    if (!sub) return '—';
    return clients.find((c) => c.id === sub.clientId)?.name ?? '—';
  };

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

  // Summary counts
  const all = usePayments().data ?? [];
  const overdueCount = all.filter((p) => p.status === 'overdue').length;
  const unpaidCount = all.filter((p) => p.status === 'unpaid').length;
  const paidCount = all.filter((p) => p.status === 'paid').length;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Paiements</h1>
        <p className="text-muted-foreground text-sm">
          Suivez et gérez les paiements de vos abonnements
        </p>
      </div>

      {/* Summary badges */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-1.5 text-sm">
          <CheckCircle2 className="text-primary h-4 w-4" />
          <span className="font-medium">{paidCount}</span>
          <span className="text-muted-foreground">payés</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm">
          <Clock className="text-muted-foreground h-4 w-4" />
          <span className="font-medium">{unpaidCount}</span>
          <span className="text-muted-foreground">en attente</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm">
          <AlertCircle className="text-destructive h-4 w-4" />
          <span className="text-destructive font-medium">{overdueCount}</span>
          <span className="text-muted-foreground">en retard</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {['all', 'unpaid', 'overdue', 'paid'].map((s) => (
          <Button
            key={s}
            size="sm"
            variant={statusFilter === s ? 'default' : 'outline'}
            onClick={() => setStatusFilter(s)}
          >
            {s === 'all' ? 'Tous' : (statusConfig[s]?.label ?? s)}
          </Button>
        ))}
      </div>

      {payments.length === 0 ? (
        <Card>
          <CardContent className="text-muted-foreground py-12 text-center">
            Aucun paiement trouvé.
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table className="table-row-hover">
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Échéance</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date de paiement</TableHead>
                <TableHead className="w-32" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => {
                const cfg = statusConfig[payment.status] ?? statusConfig.unpaid;
                const StatusIcon = cfg.icon;
                return (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">
                      {payment.subscription?.client?.name ?? getClientName(payment.subscriptionId)}
                    </TableCell>
                    <TableCell>{payment.dueDate}</TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(payment.amount, payment.currencyCode)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={cfg.variant} className="gap-1">
                        <StatusIcon className="h-3 w-3" />
                        {cfg.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {payment.paidDate ?? '—'}
                    </TableCell>
                    <TableCell>
                      {payment.status === 'paid' ? (
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
                          variant="default"
                          className="h-7 text-xs"
                          onClick={() => setConfirmPayment(payment)}
                        >
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
