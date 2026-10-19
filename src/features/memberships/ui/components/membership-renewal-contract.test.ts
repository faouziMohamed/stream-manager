import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'vitest';

const dialogPath = new URL('renew-membership-dialog.tsx', import.meta.url);
const consolePath = new URL('memberships-console.tsx', import.meta.url);

test('renewal asks for a term count before dispatching', async () => {
  const [dialog, consoleSource] = await Promise.all([
    readFile(dialogPath, 'utf8'),
    readFile(consolePath, 'utf8'),
  ]);

  // The dialog owns the terms and the settle choice, not a bare confirm.
  assert.match(dialog, /TERM_OPTIONS/);
  assert.match(dialog, /markPaid/);
  assert.match(
    dialog,
    /onConfirmAction\(\{ markPaid, paidDate: markPaid \? paidDate : undefined, terms \}\)/
  );
  assert.match(
    consoleSource,
    /renewMutation\.mutate\(\s*\{ id: renewTarget\.id, markPaid, paidDate, terms \}/
  );
});

test('the ledger renews through the dialog rather than firing on click', async () => {
  const source = await readFile(consolePath, 'utf8');

  assert.match(source, /<RenewMembershipDialog/);
  assert.match(source, /onClick=\{\(\) => setRenewTarget\(row\)\}/);
  assert.doesNotMatch(source, /onClick=\{\(\) => renewMutation\.mutate\(row\.id\)\}/);
});
