/**
 * Role-based access control helpers
 */

export type AllowedRole = 'admin' | 'accountant';

export function canAccessConsole(role?: string): boolean {
  return role === 'admin' || role === 'accountant';
}

export function isAdmin(role?: string): boolean {
  return role === 'admin';
}

export function isAccountant(role?: string): boolean {
  return role === 'accountant';
}

export function requireRole(
  role?: string,
  required: AllowedRole | AllowedRole[] = ['admin', 'accountant']
): boolean {
  const requiredRoles = Array.isArray(required) ? required : [required];
  return requiredRoles.includes(role as AllowedRole);
}
