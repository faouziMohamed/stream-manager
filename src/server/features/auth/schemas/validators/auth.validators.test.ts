import {
  loginInputSchema,
  loginWithOAuthInputSchema,
} from '@/server/features/auth/schemas/validators/auth.validators';

describe('loginInputSchema', () => {
  it('accepts valid login input', () => {
    const result = loginInputSchema.parse({
      email: 'test@example.com',
      password: 'password123',
    });
    expect(result.email).toBe('test@example.com');
    expect(result.password).toBe('password123');
  });

  it('rejects invalid email', () => {
    expect(() =>
      loginInputSchema.parse({
        email: 'not-an-email',
        password: 'password123',
      })
    ).toThrow();
  });

  it('rejects short password', () => {
    expect(() =>
      loginInputSchema.parse({ email: 'test@example.com', password: 'short' })
    ).toThrow();
  });
});

describe('loginWithOAuthInputSchema', () => {
  it('accepts valid OAuth input with all fields', () => {
    const result = loginWithOAuthInputSchema.parse({
      email: 'test@example.com',
      name: 'Test User',
      avatar: 'https://example.com/avatar.png',
    });
    expect(result.email).toBe('test@example.com');
    expect(result.name).toBe('Test User');
    expect(result.avatar).toBe('https://example.com/avatar.png');
  });

  it('accepts valid OAuth input without avatar', () => {
    const result = loginWithOAuthInputSchema.parse({
      email: 'test@example.com',
      name: 'Test User',
    });
    expect(result.avatar).toBeUndefined();
  });

  it('accepts null avatar', () => {
    const result = loginWithOAuthInputSchema.parse({
      email: 'test@example.com',
      name: 'Test User',
      avatar: null,
    });
    expect(result.avatar).toBeNull();
  });

  it('rejects empty name', () => {
    expect(() =>
      loginWithOAuthInputSchema.parse({ email: 'test@example.com', name: '' })
    ).toThrow();
  });

  it('rejects invalid email', () => {
    expect(() => loginWithOAuthInputSchema.parse({ email: 'bad', name: 'Test User' })).toThrow();
  });
});
