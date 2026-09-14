import { test, expect } from '@playwright/test';

const MAXW = 1180;
const GUTTER = 24;

async function hydrateWholePage(page: import('@playwright/test').Page) {
  await page.evaluate(async () => {
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
    const h = document.documentElement.scrollHeight;
    for (let y = 0; y < h; y += 350) {
      window.scrollTo(0, y);
      await sleep(20);
    }
    window.scrollTo(0, 0);
    await sleep(300);
  });
  await page.waitForTimeout(900);
}

test.describe('hero composition', () => {
  test('press engraving stays inside the page grid', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'asymmetric split is desktop-only');
    await page.goto('/');
    await page.waitForTimeout(800);

    const { bgRight, vw } = await page.evaluate(() => {
      const bg = document.querySelector('.hero-bg')!.getBoundingClientRect();
      return { bgRight: bg.right, vw: window.innerWidth };
    });

    // Right edge on the container content edge — NOT the raw viewport edge, which
    // is what made the whole hero read as shifted right.
    const expected = vw - Math.max(GUTTER, (vw - MAXW) / 2 + GUTTER);
    expect(Math.abs(bgRight - expected)).toBeLessThanOrEqual(1);
  });
});

test.describe('through-phone showcase', () => {
  test('copy and phone stand as one centred pair on every capability', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'side-by-side layout is desktop-only');
    await page.goto('/');
    await hydrateWholePage(page);

    const geo = await page.evaluate(() => {
      const s = document.querySelector('.through-phone') as HTMLElement;
      return {
        pinned: s.dataset.pinned,
        top: s.getBoundingClientRect().top + window.scrollY,
        range: s.offsetHeight - window.innerHeight,
      };
    });
    expect(geo.pinned).toBe('true');

    const seen: { side?: string; feature: number; marginL: number; marginR: number; phoneL: number }[] = [];
    for (const action of [0.5, 5.5, 10.5]) {
      await page.evaluate(
        ([top, range, a]) => window.scrollTo(0, Math.round(top + range * (a / 13))),
        [geo.top, geo.range, action] as const
      );
      await page.waitForTimeout(1200);
      seen.push(
        await page.evaluate(() => {
          const panels = [...document.querySelectorAll('.tp-panel')];
          const phone = document.querySelector('.tp-phone')!.getBoundingClientRect();
          const copy = document.querySelector('.tp-panel.is-active')!.getBoundingClientRect();
          const side = (document.querySelector('.through-phone') as HTMLElement).dataset.side;
          const track = Math.min(window.innerWidth, 1180);
          const gridL = (window.innerWidth - track) / 2 + 24;
          const gridR = window.innerWidth - gridL;
          const onRight = side === 'right';
          return {
            side,
            feature: panels.findIndex((p) => p.classList.contains('is-active')),
            marginL: Math.round((onRight ? copy.left : phone.left) - gridL),
            marginR: Math.round(gridR - (onRight ? phone.right : copy.right)),
            phoneL: Math.round(phone.left),
          };
        })
      );
    }

    expect(seen.map((s) => s.feature)).toEqual([0, 1, 2]);
    // The pair is centred: equal air on both sides of copy+phone, every step.
    for (const s of seen) expect(Math.abs(s.marginL - s.marginR)).toBeLessThanOrEqual(2);
    // …and the phone still travels between capabilities.
    expect(seen[0].side).toBe('right');
    expect(seen[1].side).toBe('left');
    expect(seen[1].phoneL).toBeLessThan(seen[0].phoneL);
  });
});

test.describe('through-phone hydration', () => {
  test('phone never renders off-centre before the island hydrates', async ({ page }) => {
    await page.goto('/');

    // The island is client:visible, so this is the layout the browser paints
    // while the JS is still on its way — and what a reduced-motion or no-JS
    // visitor keeps for good. It used to sit half a --maxw to the left because
    // the fallback dropped the track to position:static without clearing the
    // translateX(-50%) that only centres it while absolutely positioned.
    const pre = await page.evaluate(() => {
      const sec = document.querySelector('.through-phone') as HTMLElement;
      const phone = document.querySelector('.tp-phone')!.getBoundingClientRect();
      return {
        pinned: sec.dataset.pinned,
        phoneCentre: phone.left + phone.width / 2,
        viewportCentre: window.innerWidth / 2,
        transition: getComputedStyle(document.querySelector('.tp-phone')!).transitionDuration,
      };
    });

    expect(pre.pinned).toBe('false');
    expect(Math.abs(pre.phoneCentre - pre.viewportCentre)).toBeLessThanOrEqual(12);
    // A live transition here would play the hydration swap as a flight across
    // the viewport instead of an instant, invisible hand-over.
    expect(pre.transition).toBe('0s');

    await hydrateWholePage(page);

    const post = await page.evaluate(() => {
      const sec = document.querySelector('.through-phone') as HTMLElement;
      return { pinned: sec.dataset.pinned, ready: sec.dataset.ready };
    });
    expect(post.pinned).toBe('true');
    expect(post.ready).toBe('true');
  });
});

test.describe('hero scrub', () => {
  test('frames start streaming on the first scroll, spread across the sequence', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'desktop sequence only');
    const requested: number[] = [];
    page.on('request', (r) => {
      const m = r.url().match(/\/hero-frames\/hero\/(\d+)\.webp$/);
      if (m) requested.push(Number(m[1]));
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
    for (let i = 0; i < 12; i++) {
      await page.mouse.wheel(0, 120);
      await page.waitForTimeout(50);
    }
    await page.waitForTimeout(1500);

    expect(requested.length).toBeGreaterThan(4);
    // Coarse-to-fine: the early requests must SPAN the sequence, not creep 1,2,3…
    // — a strictly sequential prefix leaves the rest of the scrub frozen.
    const early = requested.slice(0, 5);
    expect(Math.max(...early) - Math.min(...early)).toBeGreaterThan(8);
  });
});
