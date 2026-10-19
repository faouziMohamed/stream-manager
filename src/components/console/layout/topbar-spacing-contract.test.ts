import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { test } from 'vitest';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(currentDir, '../../../..');

test('topbar breadcrumb guards against left-side overflow', () => {
  const breadcrumbSource = readWorkspaceFile('src/components/console/layout/topbar-breadcrumb.tsx');

  assert.equal(
    /min-w-0/.test(breadcrumbSource),
    true,
    'Topbar breadcrumb must allow its container to shrink (min-w-0) to prevent overflow.'
  );
  assert.equal(
    /truncate/.test(breadcrumbSource),
    true,
    'Topbar breadcrumb text must truncate to prevent left-side overflow.'
  );
});

function readWorkspaceFile(relativePath: string): string {
  return readFileSync(path.join(workspaceRoot, relativePath), 'utf8');
}
