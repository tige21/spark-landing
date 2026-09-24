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
    // launch. Without this step people cut the network immediately and conclude we lied. Only one
    // guide renders per platform, so assert on the instruction rather than on a specific list.
    await expect(page.locator('#install')).toContainText('один раз с интернетом');
  });
});

test.describe('install section — phone guides', () => {
  test('shows both iPhone and Android steps regardless of the visitor platform', async ({ page }) => {
    await page.goto('/');
    await page.locator('#install').scrollIntoViewIfNeeded();

    const section = page.locator('#install');
    // Read from a laptop as often as from a phone: hiding the other platform made the section
    // useless for anyone setting the game up for someone else.
    await expect(section).toContainText(ru.install.ios.title);
    await expect(section).toContainText(ru.install.android.title);
    await expect(section).toContainText(ru.install.desktopNote);
  });
});

test.describe('install section — already installed', () => {
  test('collapses to a single line when opened from the home screen', async ({ page }) => {
    // Playwright cannot emulate display-mode, so override matchMedia before any script runs —
    // that is the exact signal the island reads to decide the app is already installed.
    await page.addInitScript(() => {
      const real = window.matchMedia.bind(window);
      window.matchMedia = ((query: string) =>
        query.includes('display-mode: standalone')
          ? ({ matches: true, media: query, addEventListener() {}, removeEventListener() {} } as unknown as MediaQueryList)
          : real(query)) as typeof window.matchMedia;
    });

    await page.goto('/');
    await page.locator('#install').scrollIntoViewIfNeeded();

    const section = page.locator('#install');
    await expect(section).toContainText(ru.install.installed);
    // The guides and the link are the whole point of the other states; none of them belong here.
    await expect(section).not.toContainText(ru.install.android.title);
    await expect(section.locator(`a[href="${PLAY_URL}"]`)).toHaveCount(0);
  });
});
