import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { test } from 'vitest';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(currentDir, '../../../..');

test('console theme uses readable, tokenized sidebar colors across light and dark', () => {
  const sidebarSource = readWorkspaceFile('src/components/console/layout/sidebar.tsx');
  const globalsSource = readWorkspaceFile('src/app/globals.css');

  assert.equal(
    /text-white\/45|text-white\/60|border-white\/10|hover:bg-white\/10/.test(sidebarSource),
    false,
    'Sidebar should use theme tokens instead of hard-coded translucent white colors so light theme stays readable.'
  );

  assert.equal(
    /--sm-sidebar-helper:/.test(globalsSource),
    true,
    'Theme tokens should define a dedicated sidebar helper color so light-theme subtitles stay readable.'
  );

  assert.equal(
    /\.light\s*{[\S\s]*--sm-sidebar-helper:/.test(globalsSource),
    true,
    'Light theme should override the sidebar helper text token for proper contrast.'
  );

  assert.equal(
    /text-\(--sm-sidebar-helper\)/.test(sidebarSource),
    true,
    'Sidebar helper copy should use the dedicated helper token instead of the generic muted color.'
  );
});

function readWorkspaceFile(relativePath: string): string {
  return readFileSync(path.join(workspaceRoot, relativePath), 'utf8');
}
