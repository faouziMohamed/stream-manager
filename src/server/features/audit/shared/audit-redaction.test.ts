import { redactAuditValue } from '@/server/features/audit/shared/audit-redaction';

describe('redactAuditValue', () => {
  it('redacts secrets at any depth', () => {
    const redacted = redactAuditValue({
      input: {
        email: 'admin@example.com',
        nested: { password: 'hunter2', pin: '1234' },
        token: 'ses_abc',
      },
    }) as Record<string, Record<string, unknown>>;

    expect(redacted.input).toMatchObject({
      email: 'admin@example.com',
      nested: { password: '[redacted]', pin: '[redacted]' },
      token: '[redacted]',
    });
  });

  it('keeps the values an audit reader needs', () => {
    const redacted = redactAuditValue({
      input: { amount: '50.00', id: 'mbr_123', markPaid: true },
    });

    expect(redacted).toEqual({ input: { amount: '50.00', id: 'mbr_123', markPaid: true } });
  });

  it('truncates a pasted document instead of storing it whole', () => {
    const redacted = redactAuditValue({ notes: 'x'.repeat(5000) }) as {
      notes: string;
    };

    expect(redacted.notes.length).toBeLessThan(2100);
    expect(redacted.notes.endsWith('…')).toBe(true);
  });

  it('survives odd values without throwing', () => {
    const missing: unknown = undefined;

    expect(redactAuditValue(missing)).toBeNull();
    expect(redactAuditValue([1, null, 'x'])).toEqual([1, null, 'x']);
    expect(redactAuditValue(new Date('2026-10-19T00:00:00.000Z'))).toBe('2026-10-19T00:00:00.000Z');
  });
});
