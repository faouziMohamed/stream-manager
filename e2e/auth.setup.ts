import { mkdirSync } from 'node:fs';
import path from 'node:path';

import { expect, test as setup } from '@playwright/test';

import { STORAGE_STATE } from '../playwright.config';

const email = process.env.E2E_USER_EMAIL ?? '';
const password = process.env.E2E_USER_PASSWORD ?? '';

setup('authenticate as an operator', async ({ page }) => {
  setup.skip(
    email === '' || password === '',
    'Set E2E_USER_EMAIL and E2E_USER_PASSWORD (with a reachable seeded API) to run authenticated E2E.'
  );

  await page.goto('/login');
  await page.getByLabel('E-mail address').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();

  // A successful credential login lands inside the gated console.
  await page.waitForURL('**/console**');
  await expect(page).toHaveURL(/\/console/);

  mkdirSync(path.dirname(STORAGE_STATE), { recursive: true });
  await page.context().storageState({ path: STORAGE_STATE });
});
