// Payments GraphQL operations
export const GET_PAYMENTS = /* GraphQL */ `
  query GetPayments(
    $subscriptionId: ID
    $status: PaymentStatus
    $fromDate: Date
    $toDate: Date
  ) {
    payments(
      subscriptionId: $subscriptionId
      status: $status
      fromDate: $fromDate
      toDate: $toDate
    ) {
      id
      subscriptionId
      dueDate
      paidDate
      amount
      currencyCode
      status
      notes
      subscription {
        id
        client {
          id
          name
        }
        plan {
          id
          name
          durationMonths
        }
      }
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_PAYMENT = /* GraphQL */ `
  mutation UpdatePayment($id: ID!, $input: UpdatePaymentInput!) {
    updatePayment(id: $id, input: $input) {
      id
      status
      paidDate
      notes
      updatedAt
    }
  }
`;

export const MARK_PAYMENT_PAID = /* GraphQL */ `
  mutation MarkPaymentPaid($id: ID!, $paidDate: Date) {
    markPaymentPaid(id: $id, paidDate: $paidDate) {
      id
      status
      paidDate
      updatedAt
    }
  }
`;

export type PaymentStatus = "paid" | "unpaid" | "overdue";

export interface PaymentDto {
  id: string;
  subscriptionId: string;
  dueDate: string;
  paidDate: string | null;
  amount: number;
  currencyCode: string;
  status: PaymentStatus;
  notes: string | null;
  subscription?: {
    id: string;
    client?: { id: string; name: string };
    plan?: { id: string; name: string; durationMonths: number };
  };
  createdAt: string;
  updatedAt: string;
}

export interface UpdatePaymentInput {
  status?: PaymentStatus;
  paidDate?: string;
  notes?: string;
}
