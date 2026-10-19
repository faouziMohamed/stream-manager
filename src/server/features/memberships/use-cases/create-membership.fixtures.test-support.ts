import type { GqlContext } from '@/server/features/common/schemas/model/context.model';

export const adminContext: GqlContext = {
  isAccountant: false,
  isAdmin: true,
  sessionId: 'ses_admin',
  user: {
    avatar: null,
    email: 'admin@example.com',
    id: 'usr_admin',
    name: 'Admin',
    role: 'admin',
  },
};

export const userContext: GqlContext = {
  isAccountant: false,
  isAdmin: false,
  sessionId: 'ses_user',
  user: {
    avatar: null,
    email: 'user@example.com',
    id: 'usr_user',
    name: 'User',
    role: 'user',
  },
};

export const customerRecord = {
  businessId: 'CST-0001',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  email: 'customer@example.com',
  id: 'cst_test',
  isActive: true,
  name: 'Customer',
  notesContent: null,
  phone: null,
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

export const planRecord = {
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  currencyCode: 'MAD',
  durationMonths: 1,
  id: 'pln_test',
  isActive: true,
  name: 'Netflix Standard',
  planType: 'shared' as const,
  price: '99.99',
  serviceId: 'svc_test',
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

export const serviceRecord = {
  category: 'video' as const,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  deletedAt: null,
  descriptionContent: null,
  id: 'svc_test',
  imageKey: null,
  isActive: true,
  name: 'Netflix',
  supportsProfiles: true,
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

export const paymentRecord = {
  amount: '99.99',
  businessId: 'PAY-2026-0003',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  currencyCode: 'MAD',
  customerId: 'cst_test',
  dueDate: '2026-05-10',
  id: 'pay_test',
  membershipId: 'mbr_test',
  method: null,
  notes: null,
  paidDate: null,
  status: 'unpaid' as const,
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

export const membershipRecord = {
  businessId: 'MBR-2026-0008',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  customerId: 'cst_test',
  endDate: '2026-06-10',
  id: 'mbr_test',
  isRecurring: true,
  payment: paymentRecord,
  planId: 'pln_test',
  renewedFromId: null,
  startDate: '2026-05-10',
  status: 'active' as const,
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};
