import { readFileSync } from 'node:fs';
import path from 'node:path';

const serverRoot = path.resolve(process.cwd(), 'src/server');

describe('plans repository', () => {
  it('does not import the database client at module top level', () => {
    const source = readFileSync(
      path.join(serverRoot, 'features/plans/repositories/plans.repository.ts'),
      'utf8'
    );

    expect(source).not.toMatch(/import\s+{\s*db\s*}\s+from\s+["']@\/server\/lib\/db\/client["']/);
    expect(source).toMatch(/await import\(["']@\/server\/lib\/db\/client["']\)/);
  });

  it('exports plan repository functions used by use cases', async () => {
    const repository = await import('@/server/features/plans/repositories/plans.repository');

    expect(repository).toHaveProperty('findPlanById');
    expect(repository).toHaveProperty('findPlansByServiceId');
    expect(repository).toHaveProperty('countActiveMembershipsForPlan');
    expect(repository).toHaveProperty('deletePlan');
    expect(repository).toHaveProperty('updatePlan');
    expect(repository).toHaveProperty('insertPlan');
  });
});
