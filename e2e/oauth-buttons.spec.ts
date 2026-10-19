import { expect, test, type Page } from '@playwright/test';

// Brand fills must stay identical in light AND dark — they must not be
// overridden by a button variant's theme-token state classes.
const GITHUB_BG = 'rgb(36, 41, 47)'; // #24292f
const GOOGLE_BG = 'rgb(255, 255, 255)'; // #ffffff

async function readBackground(page: Page, name: string): Promise<string> {
  const button = page.getByRole('button', { name });
  await expect(button).toBeVisible();
  return button.evaluate((el) => getComputedStyle(el).backgroundColor);
}

for (const colorScheme of ['light', 'dark'] as const) {
  test.describe(`OAuth buttons keep brand colors in ${colorScheme} mode`, () => {
    test.use({ colorScheme });

    test('GitHub and Google render their brand fills', async ({ page }) => {
      await page.goto('/login');

      expect(await readBackground(page, 'GitHub')).toBe(GITHUB_BG);
      expect(await readBackground(page, 'Google')).toBe(GOOGLE_BG);
    });
  });
}
