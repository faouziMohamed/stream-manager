export function authUserRow(input: {
  avatar?: string | null;
  email: string;
  id: string;
  name: string;
  passwordHash?: string | null;
  role?: 'accountant' | 'admin' | 'user';
}) {
  return {
    avatar: input.avatar ?? null,
    createdAt: new Date('2026-01-01'),
    email: input.email,
    id: input.id,
    name: input.name,
    passwordHash: input.passwordHash ?? null,
    role: input.role ?? 'user',
    updatedAt: new Date('2026-01-01'),
  };
}
