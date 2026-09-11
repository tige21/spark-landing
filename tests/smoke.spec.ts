import { test, expect } from '@playwright/test';
import { TELEGRAM_BOT_URL } from '../src/config/site';

// Read the single source of truth: a hardcoded copy here silently went stale
// when the CTA was repointed from the test bot to the prod one (067e63b).
const BOT_URL = TELEGRAM_BOT_URL;

test.describe('landing — ru', () => {
  test('hero, sections and primary bot CTA render', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('.hero h1')).toBeVisible();

    const cta = page.getByRole('link', { name: 'Играть' }).first();
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

    const cta = page.getByRole('link', { name: 'Play' }).first();
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute('href', BOT_URL);
  });
});

async function maxScrollWidth(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    let max = 0;
    for (const y of [0, 1200, 2400, 3600, 4800, 6000]) {
      window.scrollTo(0, y);
      max = Math.max(max, document.documentElement.scrollWidth);
    }
    window.scrollTo(0, 0);
    return { max, client: document.documentElement.clientWidth };
  });
}

test('no horizontal overflow through the whole page', async ({ page }) => {
  await page.goto('/');
  const { max, client } = await maxScrollWidth(page);
  expect(max).toBeLessThanOrEqual(client + 1);
});

test.describe('reduced motion', () => {
  test('content stays visible and layout holds with motion disabled', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await expect(page.locator('.hero h1')).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Играть' }).first()
    ).toBeVisible();
    await page.locator('#decks').scrollIntoViewIfNeeded();
    await expect(page.locator('.deck-card')).toHaveCount(9);

    const { max, client } = await maxScrollWidth(page);
    expect(max).toBeLessThanOrEqual(client + 1);
  });
});
