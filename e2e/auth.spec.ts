import { expect, test } from '@playwright/test';

test('unauthenticated access to the console redirects to login', async ({ page }) => {
  await page.goto('/console');
  await expect(page).toHaveURL(/\/login/);
});

test('login page renders the credentials form and validates empty submit', async ({ page }) => {
  await page.goto('/login');

  await expect(page.getByLabel('E-mail address')).toBeVisible();
  await expect(page.getByLabel('Password', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Sign in', exact: true }).click();

  // Client-side zod validation should block navigation and keep us on /login.
  await expect(page).toHaveURL(/\/login/);
});
