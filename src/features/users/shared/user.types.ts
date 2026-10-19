export type UserManagementListItem = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'accountant' | 'user';
  avatar: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UserRole = 'admin' | 'accountant' | 'user';

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrator',
  accountant: 'Accountant',
  user: 'User',
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  admin: 'Full access to all features and settings',
  accountant: 'Access to operations and insights',
  user: 'Limited access',
};
