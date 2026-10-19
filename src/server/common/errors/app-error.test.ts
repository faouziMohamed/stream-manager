import { AppError } from '@/server/common/errors/app-error';

describe('AppError', () => {
  it('defaults to status 500 with no code', () => {
    const error = new AppError('boom');
    expect(error.statusCode).toBe(500);
    expect(error.code).toBeUndefined();
    expect(error.message).toBe('boom');
  });

  it('carries a custom status code and machine-readable code', () => {
    const error = new AppError('Not found', 404, 'CUSTOMER_NOT_FOUND');
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe('CUSTOMER_NOT_FOUND');
  });

  it('is an Error subclass with the AppError name', () => {
    const error = new AppError('x', 400);
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
    expect(error.name).toBe('AppError');
  });

  it('preserves its properties when thrown and caught', () => {
    try {
      throw new AppError('inactive', 409, 'PLAN_INACTIVE');
    } catch (error_) {
      expect(error_).toBeInstanceOf(AppError);
      const error = error_ as AppError;
      expect(error.statusCode).toBe(409);
      expect(error.code).toBe('PLAN_INACTIVE');
    }
  });
});
