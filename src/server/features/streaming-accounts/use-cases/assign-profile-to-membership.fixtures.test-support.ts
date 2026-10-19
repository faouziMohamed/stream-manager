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

export const testDate = new Date('2026-01-01T00:00:00.000Z');

export const profileRecord = {
  accountId: 'acc_test',
  createdAt: testDate,
  id: 'prf_test',
  isAssigned: false,
  name: 'Profile 1',
  pinEncrypted: null,
  updatedAt: testDate,
};

export const assignmentRecord = {
  accountId: 'acc_test',
  assignedAt: testDate,
  createdAt: testDate,
  id: 'asg_test',
  membershipId: 'mbr_test',
  profileId: 'prf_test',
};
