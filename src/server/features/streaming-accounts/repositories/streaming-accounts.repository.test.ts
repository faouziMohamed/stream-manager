import { readFileSync } from 'node:fs';
import path from 'node:path';

const serverRoot = path.resolve(process.cwd(), 'src/server');

describe('streaming-accounts repository', () => {
  it('does not import the database client at module top level', () => {
    const source = readFileSync(
      path.join(
        serverRoot,
        'features/streaming-accounts/repositories/streaming-accounts.repository.ts'
      ),
      'utf8'
    );

    expect(source).not.toMatch(/import\s+{\s*db\s*}\s+from\s+["']@\/server\/lib\/db\/client["']/);
    expect(source).toMatch(/await import\(["']@\/server\/lib\/db\/client["']\)/);
  });

  it('exports streaming-account repository functions used by use cases', async () => {
    const repository =
      await import('@/server/features/streaming-accounts/repositories/streaming-accounts.repository');

    expect(repository).toHaveProperty('insertStreamingAccount');
    expect(repository).toHaveProperty('findStreamingAccountById');
    expect(repository).toHaveProperty('findStreamingAccounts');
    expect(repository).toHaveProperty('softDeleteStreamingAccount');
    expect(repository).toHaveProperty('insertStreamingProfile');
    expect(repository).toHaveProperty('findProfileById');
    expect(repository).toHaveProperty('findProfilesByAccountId');
    expect(repository).toHaveProperty('updateProfileAssigned');
    expect(repository).toHaveProperty('insertAssignment');
    expect(repository).toHaveProperty('createAssignmentAndMarkProfileAssigned');
    expect(repository).toHaveProperty('findAssignmentById');
    expect(repository).toHaveProperty('deleteAssignment');
    expect(repository).toHaveProperty('findActiveAssignmentByProfileId');
  });
});
