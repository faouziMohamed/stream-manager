export type PaymentMethod = 'cash' | 'transfer' | 'other';
export type PaymentStatus = 'unpaid' | 'paid' | 'overdue' | 'cancelled';

export interface PaymentRecord {
  amount: string;
  businessId: string;
  createdAt: Date;
  currencyCode: string;
  customerId: string;
  dueDate: string;
  id: string;
  membershipId: string;
  method: PaymentMethod | null;
  notes: string | null;
  paidDate: string | null;
  status: PaymentStatus;
  updatedAt: Date;
}
