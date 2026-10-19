import { readFileSync } from 'node:fs';
import path from 'node:path';

const serverRoot = path.resolve(process.cwd(), 'src/server');

describe('payments repository', () => {
  it('does not import the database client at module top level', () => {
    const source = readFileSync(
      path.join(serverRoot, 'features/payments/repositories/payments.repository.ts'),
      'utf8'
    );

    expect(source).not.toMatch(/import\s+{\s*db\s*}\s+from\s+["']@\/server\/lib\/db\/client["']/);
    expect(source).toMatch(/await import\(["']@\/server\/lib\/db\/client["']\)/);
  });

  it('exports payment repository functions used by use cases', async () => {
    const repository = await import('@/server/features/payments/repositories/payments.repository');

    expect(repository).toHaveProperty('findPaymentById');
    expect(repository).toHaveProperty('updatePaymentPaid');
    expect(repository).toHaveProperty('findUnpaidPaymentsBefore');
    expect(repository).toHaveProperty('markPaymentsOverdue');
    expect(repository).toHaveProperty('findLatestPaymentBusinessId');
  });
});
