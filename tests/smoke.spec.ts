import { test, expect } from '@playwright/test';

const BOT_URL = 'https://t.me/SparkCards_TestingBot';

test.describe('landing — ru', () => {
  test('hero, sections and primary bot CTA render', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('.hero h1')).toBeVisible();

    const cta = page.getByRole('link', { name: 'Открыть в Telegram' }).first();
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute('href', BOT_URL);
    await expect(cta).toHaveAttribute('target', '_blank');

    for (const id of ['how', 'decks', 'order']) {
      await expect(page.locator(`#${id}`)).toHaveCount(1);
    }

    await page.locator('#decks').scrollIntoViewIfNeeded();
    await expect(page.locator('.deck-card')).toHaveCount(9);
  });

  test('language switch points to /en', async ({ page }) => {
    await page.goto('/');
    const langLink = page.locator('header a[hreflang="en"]');
    await expect(langLink).toHaveAttribute('href', '/en');
  });
});

test.describe('landing — en', () => {
  test('hero renders English copy and bot CTA', async ({ page }) => {
    await page.goto('/en');

    await expect(page.locator('.hero h1')).toContainText('real talk');

    const cta = page.getByRole('link', { name: 'Open in Telegram' }).first();
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute('href', BOT_URL);
  });
});
