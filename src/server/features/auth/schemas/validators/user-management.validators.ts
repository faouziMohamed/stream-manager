import { z } from 'zod';

export const updateUserRoleInputSchema = z.object({
  id: z.string().min(1, 'User ID is required'),
  role: z.enum(['admin', 'accountant', 'user']),
});

export const deleteUserInputSchema = z.object({
  id: z.string().min(1, 'User ID is required'),
});

export const logoutUserDevicesInputSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
});

export type UpdateUserRoleInput = z.infer<typeof updateUserRoleInputSchema>;
export type DeleteUserInput = z.infer<typeof deleteUserInputSchema>;
export type LogoutUserDevicesInput = z.infer<typeof logoutUserDevicesInputSchema>;
