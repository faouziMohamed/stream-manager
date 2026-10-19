import { expect, test } from '@playwright/test';

// Runs in the `chromium-authenticated` project, which loads the saved
// storageState — so we reach the console without redirecting to /login.
test('authenticated operator reaches the console dashboard', async ({ page }) => {
  await page.goto('/console');

  await expect(page).toHaveURL(/\/console/);
  await expect(page).not.toHaveURL(/\/login/);
  await expect(page.getByRole('link', { name: 'Dashboard' }).first()).toBeVisible();
});

test('console navigation exposes core operational areas', async ({ page }) => {
  await page.goto('/console/payments');

  await expect(page).toHaveURL(/\/console\/payments/);
  await expect(page.getByRole('button', { name: 'Record payment' })).toBeVisible();
});
