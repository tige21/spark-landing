import { test, expect } from '@playwright/test';
import { PLAY_URL } from '../src/config/site';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Playwright runs this as an ESM module, where a plain JSON import needs an import attribute that
// the repo's TS target does not emit. Reading the files is simpler than fighting the loader.
const content = (lang: 'ru' | 'en') =>
  JSON.parse(
    readFileSync(fileURLToPath(new URL(`../src/content/${lang}.json`, import.meta.url)), 'utf8')
  );

const ru = content('ru');
const en = content('en');

// Read the copy from the same JSON the page renders: a hardcoded string here would keep passing
// after the wording changes and stop testing anything.
const IOS_STEPS = ru.install.ios.steps;

test.describe('install section', () => {
  test('renders on both languages and links into the game, not the landing', async ({ page }) => {
    for (const [path, copy] of [
      ['/', ru],
      ['/en', en],
    ] as const) {
      await page.goto(path);

      const section = page.locator('#install');
      await expect(section).toHaveCount(1);
      await section.scrollIntoViewIfNeeded();
      await expect(section.getByText(copy.install.headline)).toBeVisible();

      // The icon has to be added from /play: a PWA installed from the landing would fall outside
      // the game's service worker scope and open to a blank screen offline.
      const link = section.locator(`a[href="${PLAY_URL}"]`).first();
      await expect(link).toBeVisible();
    }
  });

  test('tells the visitor to open the app once online', async ({ page }) => {
    await page.goto('/');
    await page.locator('#install').scrollIntoViewIfNeeded();

    // The game ships with clientsClaim disabled, so offline only starts working on the second
    // launch. Without this step people cut the network immediately and conclude we lied.
    const onlineStep = IOS_STEPS.find((step) => step.includes('с интернетом'));
    expect(onlineStep, 'iOS steps must keep the "open once online" instruction').toBeTruthy();
    await expect(page.locator('#install')).toContainText(onlineStep!);
  });
});

test.describe('install section — iOS', () => {
  test('shows the Safari steps rather than the generic fallback', async ({ browser }) => {
    // A chromium context with an iPhone UA, not devices['iPhone 13']: that descriptor switches the
    // browser to webkit, which forces a new worker and needs a second browser installed. Detection
    // under test is UA-based anyway, so the UA is the only part that matters here.
    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      viewport: { width: 390, height: 844 },
    });
    const page = await context.newPage();

    await page.goto('/');
    await page.locator('#install').scrollIntoViewIfNeeded();

    const section = page.locator('#install');
    await expect(section).toContainText(ru.install.ios.title);
    await expect(section).not.toContainText(ru.install.fallback);

    await context.close();
  });
});
