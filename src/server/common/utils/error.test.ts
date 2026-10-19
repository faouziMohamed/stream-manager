import { z } from 'zod';

import { beautify } from '@/server/common/utils/error';

function errorFrom(schema: z.ZodTypeAny, value: unknown): z.ZodError {
  const result = schema.safeParse(value);
  if (result.success) throw new Error('expected validation to fail');
  return result.error;
}

describe('beautify', () => {
  it('formats a single field issue as "path: message"', () => {
    const error = errorFrom(z.object({ email: z.email() }), { email: 'nope' });
    expect(beautify(error)).toMatch(/^email: /);
  });

  it('joins nested paths with a dot', () => {
    const error = errorFrom(z.object({ user: z.object({ age: z.number() }) }), {
      user: { age: 'x' },
    });
    expect(beautify(error)).toMatch(/^user\.age: /);
  });

  it('labels top-level (path-less) issues as "input"', () => {
    const error = errorFrom(z.string(), 123);
    expect(beautify(error)).toMatch(/^input: /);
  });

  it('joins multiple issues with a semicolon', () => {
    const error = errorFrom(z.object({ a: z.number(), b: z.number() }), { a: 'x', b: 'y' });
    const message = beautify(error);
    expect(message).toContain('a: ');
    expect(message).toContain('b: ');
    expect(message).toContain('; ');
  });
});
