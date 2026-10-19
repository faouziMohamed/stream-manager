import { expect, test } from '@playwright/test';

test('public landing page renders the brand header', async ({ page }) => {
  const response = await page.goto('/');
  expect(response?.status() ?? 200).toBeLessThan(500);
  await expect(page.getByText('StreamManager').first()).toBeVisible();
});

test('landing page exposes a console entry point', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Go to console' }).first()).toBeVisible();
});
