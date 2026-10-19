import assert from 'node:assert/strict';

import { test } from 'vitest';

import { resolveTopbarBreadcrumb, resolveTopbarDestinationHref } from './topbar-breadcrumb';
import { ROUTES } from '@/lib/config/routes';

test('topbar breadcrumb resolves the section and page from the nav', () => {
  assert.deepEqual(resolveTopbarBreadcrumb(ROUTES.console.root), {
    section: 'Workspace',
    title: 'Dashboard',
  });

  assert.deepEqual(resolveTopbarBreadcrumb(ROUTES.console.customers), {
    section: 'Customers',
    title: 'Customers',
  });

  assert.deepEqual(resolveTopbarBreadcrumb(ROUTES.console.settings.sessions, 'admin'), {
    section: 'Administration',
    title: 'Sessions',
  });
});

test('detail pages keep their section instead of falling back to the console root', () => {
  assert.deepEqual(resolveTopbarBreadcrumb('/console/customers/cst_123'), {
    section: 'Customers',
    title: 'Customers',
  });

  assert.deepEqual(resolveTopbarBreadcrumb('/console/memberships/mbr_123'), {
    section: 'Operations',
    title: 'Memberships',
  });

  assert.deepEqual(resolveTopbarBreadcrumb(ROUTES.console.newSubscription), {
    section: 'Operations',
    title: 'New subscription',
  });
});

test('admin-only routes resolve for admins and fall back gracefully otherwise', () => {
  assert.deepEqual(resolveTopbarBreadcrumb(ROUTES.console.analytics, 'admin'), {
    section: 'Insights',
    title: 'Analytics',
  });

  assert.deepEqual(resolveTopbarBreadcrumb('/console/unknown-page'), {
    section: 'Console',
    title: 'unknown page',
  });
});

test('the destination is told apart from a record inside it', () => {
  // On the destination the heading already names the page, so the breadcrumb
  // shows only the section; a record keeps the full path for context.
  assert.equal(
    resolveTopbarDestinationHref(ROUTES.console.memberships),
    ROUTES.console.memberships
  );
  assert.equal(
    resolveTopbarDestinationHref('/console/memberships/mbr_123'),
    ROUTES.console.memberships
  );
  assert.equal(resolveTopbarDestinationHref('/console/unknown-page'), undefined);
});
