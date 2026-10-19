import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'vitest';

const dialogPath = new URL('dialog.tsx', import.meta.url);
const membershipFormPath = new URL(
  '../../features/memberships/ui/components/membership-create-form.tsx',
  import.meta.url
);

// Dialogs are centered with `top-1/2 -translate-y-1/2`. Without a viewport
// max-height + internal scrolling, any dialog taller than the viewport
// (e.g. the membership create form) overflows past both edges from its
// centered anchor: the header becomes unreachable and the dialog looks
// pinned to the bottom of the page.
test('DialogContent caps its height to the viewport and scrolls overflow', async () => {
  const source = await readFile(dialogPath, 'utf8');

  assert.match(source, /max-h-\[calc\(100dvh-[^\]]+\)]/);
  assert.match(source, /overflow-y-auto/);
});

test('membership create dialog does not clip its scrollable content', async () => {
  const source = await readFile(membershipFormPath, 'utf8');

  assert.doesNotMatch(source, /overflow-hidden/);
});

// `cn()` runs tailwind-merge, which treats `relative` and `fixed` as
// conflicting position utilities: passing `relative` via className REMOVES
// the base `fixed` from DialogContent, so `top-1/2` offsets the dialog from
// its flow position instead of the viewport — it renders at the bottom of
// the page instead of centered. The fixed popup is already a containing
// block for absolutely-positioned children, so `relative` is never needed.
test('no DialogContent consumer overrides the fixed positioning with `relative`', async () => {
  const consumers = [
    membershipFormPath,
    new URL(
      '../../features/streaming-accounts/ui/components/streaming-account-create-form.tsx',
      import.meta.url
    ),
  ];

  for (const consumer of consumers) {
    const source = await readFile(consumer, 'utf8');
    assert.doesNotMatch(source, /DialogContent className="[^"]*\brelative\b/);
  }
});
