import assert from 'node:assert/strict';

import { test } from 'vitest';

import {
  buildSidebarSections,
  isActiveLink,
  isSectionActive,
  overviewItem,
} from './sidebar-navigation';
import { ROUTES } from '@/lib/config/routes';

test('sidebar navigation resolves active links, role gating, and complete admin coverage', () => {
  assert.equal(isActiveLink(ROUTES.console.root, ROUTES.console.root), true);
  assert.equal(isActiveLink(ROUTES.console.customers, ROUTES.console.root), false);
  assert.equal(isActiveLink(`${ROUTES.console.customers}/cst_123`, ROUTES.console.customers), true);

  const userSections = buildSidebarSections('user');
  assert.equal(
    userSections.some((section) => section.label === 'Administration'),
    false
  );

  const adminSections = buildSidebarSections('admin');
  assert.equal(
    adminSections.some((section) => section.label === 'Administration'),
    true
  );
  assert.equal(
    adminSections.every((section) => typeof section.defaultOpen === 'boolean'),
    true,
    'Each grouped section should declare an explicit defaultOpen state.'
  );
  assert.equal(
    ['Catalog', 'Operations'].every(
      (label) => adminSections.find((section) => section.label === label)?.defaultOpen === true
    ),
    true,
    'The primary catalog and operations sections should start expanded.'
  );

  const operations = userSections.find((section) => section.label === 'Operations');
  assert.ok(operations);
  assert.equal(isSectionActive(ROUTES.console.payments, operations), true);
  assert.equal(isSectionActive(ROUTES.console.customers, operations), false);

  const adminNavHrefs = new Set(
    [overviewItem, ...adminSections.flatMap((section) => section.items)].map((item) => item.href)
  );

  for (const href of [
    ROUTES.console.root,
    ROUTES.console.customers,
    ROUTES.console.services,
    ROUTES.console.memberships,
    ROUTES.console.payments,
    ROUTES.console.streamingAccounts,
    ROUTES.console.timeline,
    ROUTES.console.analytics,
    ROUTES.console.summary,
    ROUTES.console.media,
    // /console/settings is a redirect to sessions, not a destination.
    ROUTES.console.settings.sessions,
    ROUTES.console.users,
  ]) {
    assert.equal(adminNavHrefs.has(href), true, `Missing sidebar navigation entry for ${href}`);
  }
});
