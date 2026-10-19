import { readFileSync } from 'node:fs';
import path from 'node:path';

const serverRoot = path.resolve(process.cwd(), 'src/server');

describe('services repository', () => {
  it('does not import the database client at module top level', () => {
    const source = readFileSync(
      path.join(serverRoot, 'features/services/repositories/services.repository.ts'),
      'utf8'
    );

    expect(source).not.toMatch(/import\s+{\s*db\s*}\s+from\s+["']@\/server\/lib\/db\/client["']/);
    expect(source).toMatch(/await import\(["']@\/server\/lib\/db\/client["']\)/);
  });

  it('filters archived services out of paginated list queries', () => {
    const source = readFileSync(
      path.join(serverRoot, 'features/services/repositories/services.repository.ts'),
      'utf8'
    );

    expect(source).toMatch(/const whereActive = isNull\(servicesTable\.deletedAt\)/);
    expect(source).toMatch(/\.where\(whereActive\)/);
  });

  it('persists archive and restore state transitions consistently', () => {
    const source = readFileSync(
      path.join(serverRoot, 'features/services/repositories/services.repository.ts'),
      'utf8'
    );

    expect(source).toMatch(/deletedAt: new Date\(\)/);
    expect(source).toMatch(/isActive: false/);
    expect(source).toMatch(/deletedAt: null/);
    expect(source).toMatch(/isActive: true/);
  });

  it('exports service query functions used by use cases', async () => {
    const repository = await import('@/server/features/services/repositories/services.repository');

    expect(repository).toHaveProperty('insertService');
    expect(repository).toHaveProperty('findServiceById');
    expect(repository).toHaveProperty('findServiceByName');
    expect(repository).toHaveProperty('findServices');
    expect(repository).toHaveProperty('updateService');
    expect(repository).toHaveProperty('softDeleteService');
    expect(repository).toHaveProperty('restoreService');
  });
});
