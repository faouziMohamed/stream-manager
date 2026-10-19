import { z } from 'zod';

export const strongPasswordRuleText =
  'Password must be at least 8 characters and include uppercase, lowercase, and number.';

export const emailPolicySchema = z.email('Invalid email format').trim();

export const passwordPolicySchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .regex(/[A-Z]/, 'Password must include at least one uppercase letter')
  .regex(/[a-z]/, 'Password must include at least one lowercase letter')
  .regex(/\d/, 'Password must include at least one number');
