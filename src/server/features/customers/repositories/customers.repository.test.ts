import { readFileSync } from 'node:fs';
import path from 'node:path';

const serverRoot = path.resolve(process.cwd(), 'src/server');

describe('customers repository', () => {
  it('does not import the database client at module top level', () => {
    const source = readFileSync(
      path.join(serverRoot, 'features/customers/repositories/customers.repository.ts'),
      'utf8'
    );

    expect(source).not.toMatch(/import\s+{\s*db\s*}\s+from\s+["']@\/server\/lib\/db\/client["']/);
    expect(source).toMatch(/await import\(["']@\/server\/lib\/db\/client["']\)/);
  });

  it('exports customer repository functions used by upcoming use cases', async () => {
    const repository =
      await import('@/server/features/customers/repositories/customers.repository');

    expect(repository).toHaveProperty('findCustomerById');
    expect(repository).toHaveProperty('findCustomers');
    expect(repository).toHaveProperty('findLatestCustomerBusinessId');
    expect(repository).toHaveProperty('insertCustomer');
    expect(repository).toHaveProperty('updateCustomer');
    expect(repository).toHaveProperty('countActiveMembershipsForCustomer');
  });
});
