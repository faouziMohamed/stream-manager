import { getAllPayments } from "@/lib/db/repositories/payments.repository";
import { PaymentsEditor } from "@/components/console/cms/payments-editor";
import type { PaymentDto } from "@/lib/graphql/operations/payments.operations";

export default async function PaymentsPage() {
  const rows = await getAllPayments();
  const payments: PaymentDto[] = rows.map((p) => ({
    ...p,
    amount: parseFloat(p.amount),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));
  return <PaymentsEditor initialData={payments} />;
}
