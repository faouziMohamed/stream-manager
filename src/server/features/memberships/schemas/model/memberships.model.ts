export type MembershipStatus = 'active' | 'expired' | 'cancelled' | 'pending';

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
  status: MembershipStatus;
  updatedAt: Date;
}

export interface MembershipDto {
  businessId: string;
  createdAt: string;
  customerId: string;
  endDate: string;
  id: string;
  isRecurring: boolean;
  payment?: unknown;
  planId: string;
  renewedFromId: string | null;
  startDate: string;
  status: MembershipStatus;
  updatedAt: string;
}
