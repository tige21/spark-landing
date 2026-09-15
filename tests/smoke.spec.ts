import { test, expect } from '@playwright/test';
import { PLAY_URL, TELEGRAM_BOT_URL } from '../src/config/site';

// Read the single source of truth: a hardcoded copy here silently went stale
// when the CTA was repointed from the test bot to the prod one (067e63b).
const BOT_URL = TELEGRAM_BOT_URL;

test.describe('landing — ru', () => {
  test('hero, sections and primary bot CTA render', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('.hero h1')).toBeVisible();

    const cta = page.locator('header a[data-cta="browser"]').first();
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute('href', PLAY_URL);

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

    const cta = page.locator('header a[data-cta="browser"]').first();
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute('href', PLAY_URL);
  });
});

test.describe('both ways into the game', () => {
  for (const path of ['/', '/en']) {
    test(`${path} offers the browser build and the Telegram app`, async ({ page }) => {
      await page.goto(path);

      // Before this, every CTA on the landing went to the bot and the live web
      // build at /play was reachable only through the footer's legal links.
      const browser = page.locator('a[data-cta="browser"]');
      const telegram = page.locator('a[data-cta="telegram"]');

      // hero + final block offer the choice; the header carries the primary only.
      expect(await browser.count()).toBeGreaterThanOrEqual(3);
      expect(await telegram.count()).toBeGreaterThanOrEqual(2);

      for (const el of await browser.all()) {
        // same-origin build: staying in the tab is the point of the option
        await expect(el).toHaveAttribute('href', PLAY_URL);
        await expect(el).not.toHaveAttribute('target', '_blank');
      }
      for (const el of await telegram.all()) {
        await expect(el).toHaveAttribute('href', BOT_URL);
        await expect(el).toHaveAttribute('target', '_blank');
      }

      // the pair reads as a choice, not one button repeated
      const hero = page.locator('.hero-cta a[data-cta]');
      await expect(hero).toHaveCount(2);

      // Neither destination is styled down: the choice is between where you
      // play, not between a main action and a lesser one.
      for (const sel of ['.hero-cta a[data-cta]', '.final a[data-cta]']) {
        const diff = await page.evaluate((s) => {
          const pick = (el: Element) => {
            const cs = getComputedStyle(el);
            return [cs.backgroundColor, cs.color, cs.border, cs.borderRadius, cs.boxShadow, cs.fontSize, cs.fontWeight, cs.padding].join('|');
          };
          const els = [...document.querySelectorAll(s)];
          return els.length === 2 && pick(els[0]) === pick(els[1]) ? null : { count: els.length, a: els[0] && pick(els[0]), b: els[1] && pick(els[1]) };
        }, sel);
        expect(diff, `${sel} buttons must look identical`).toBeNull();
      }
    });
  }
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
