import type { PaymentRecord } from '@/server/features/payments/schemas/model/payments.model';

export interface CustomerRecord {
  businessId: string;
  createdAt: Date;
  email: string | null;
  id: string;
  isActive: boolean;
  name: string;
  notesContent: unknown | null;
  phone: string | null;
  updatedAt: Date;
}

export interface PlanRecord {
  createdAt: Date;
  currencyCode: string;
  durationMonths: number;
  id: string;
  isActive: boolean;
  name: string;
  planType: 'individual' | 'shared' | 'family';
  price: string;
  serviceId: string;
  updatedAt: Date;
}

export interface MembershipRecord {
  businessId: string;
  createdAt: Date;
  customerId: string;
  endDate: string;
  id: string;
  isRecurring: boolean;
  planId: string;
  renewedFromId: string | null;
  startDate: string;
  status: 'active' | 'expired' | 'cancelled' | 'pending';
  updatedAt: Date;
}

export interface MembershipWithPaymentRecord extends MembershipRecord {
  payment: PaymentRecord;
}

export interface InsertMembershipInput {
  businessId: string;
  customerId: string;
  endDate: string;
  id: string;
  isRecurring: boolean;
  planId: string;
  renewedFromId: string | null;
  startDate: string;
  status: 'active' | 'expired' | 'cancelled' | 'pending';
}

export interface InsertPaymentInput {
  amount: string;
  businessId: string;
  currencyCode: string;
  customerId: string;
  dueDate: string;
  id: string;
  membershipId: string;
  /** Set when the money was taken up front, so nothing is left to chase. */
  paidDate?: string | null;
  status: 'unpaid' | 'paid' | 'overdue' | 'cancelled';
}

export interface InsertMembershipWithPaymentInput {
  membership: InsertMembershipInput;
  payment: InsertPaymentInput;
}
