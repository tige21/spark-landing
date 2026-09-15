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
  test('copy and press bound one pair centred on the page', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'asymmetric split is desktop-only');
    await page.goto('/');
    await page.waitForTimeout(800);

    // The engraving carries blank paper on its right: ink ends at x=800 of the
    // 960px frame on every one of the 55 frames. Aligning the IMAGE box to the
    // grid line left the PRESS a sixth of its width short of it, so the artwork
    // sat mid-page instead of holding the right half.
    const FRAME = { w: 960, h: 852, inkRight: 800 };

    const geo = await page.evaluate((frame) => {
      const bg = document.querySelector('.hero-bg')!.getBoundingClientRect();
      const copy = document.querySelector('.hero-content')!.getBoundingClientRect();
      // object-fit: contain + object-position: right center
      const renderedH = Math.min(bg.height, (bg.width * frame.h) / frame.w);
      const renderedW = (renderedH * frame.w) / frame.h;
      return {
        content: document.documentElement.clientWidth,
        copyLeft: copy.left,
        inkRight: bg.right - (renderedW * (frame.w - frame.inkRight)) / frame.w,
      };
    }, FRAME);

    const inset = Math.max(GUTTER, (geo.content - MAXW) / 2 + GUTTER);

    // The press's own edge sits on the grid line the nav and sections start on…
    expect(Math.abs(geo.inkRight - (geo.content - inset))).toBeLessThanOrEqual(1);
    // …so copy and press bound a pair with equal air on both sides.
    expect(Math.abs(geo.copyLeft - (geo.content - geo.inkRight))).toBeLessThanOrEqual(2);
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

test.describe('through-phone on mobile', () => {
  test('the phone stays on screen on every capability', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'top-anchored phone is the mobile layout');
    await page.goto('/');
    await hydrateWholePage(page);

    // Mobile anchors the phone by its TOP (`top: var(--phone-top)`), desktop by
    // its middle (`top: 50%` + a vertical -50% in the transform). The mobile
    // override only restated `.tp-phone`, so `[data-side='left'] .tp-phone` —
    // higher specificity, set by the odd-indexed capability (Игра) — kept
    // winning and reapplied that -50%, lifting the phone by half its own height
    // clean off the top of the screen.
    const walk = await page.evaluate(async () => {
      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
      const sec = document.querySelector('.through-phone') as HTMLElement;
      sec.scrollIntoView({ block: 'start' });
      await sleep(1200);
      const top = sec.getBoundingClientRect().top + window.scrollY;
      const range = sec.offsetHeight - window.innerHeight;
      const A = document.querySelectorAll('.tp-snap-point').length;

      const seen: { side: string; phoneTop: number; gap: number }[] = [];
      for (let i = 0; i < A; i++) {
        window.scrollTo(0, Math.round(top + range * ((i + 0.5) / A)));
        await sleep(450);
        const phone = document.querySelector('.tp-phone')!.getBoundingClientRect();
        const panel = document.querySelector('.tp-panel.is-active');
        const cap = panel ? panel.getBoundingClientRect() : null;
        seen.push({
          side: sec.dataset.side ?? '',
          phoneTop: Math.round(phone.top),
          gap: cap ? Math.round(cap.top - phone.bottom) : -1,
        });
      }
      return { seen, sides: [...new Set(seen.map((s) => s.side))] };
    });

    // both sides actually occur, or the test would pass without exercising the bug
    expect(walk.sides.sort()).toEqual(['left', 'right']);
    for (const step of walk.seen) {
      expect(step.phoneTop, `phone off the top on data-side=${step.side}`).toBeGreaterThanOrEqual(0);
    }
    // the caption is anchored to the phone, so the pair never drifts apart
    expect([...new Set(walk.seen.map((s) => s.gap))]).toHaveLength(1);
  });
});

test.describe('decks section stays cheap', () => {
  test('no standing compositor hints and no hydrated card grid', async ({ page }) => {
    await page.goto('/');
    await hydrateWholePage(page);

    // This block stuttered under the scroll because it was carrying a permanent
    // compositor bill: a 3D rendering context on the grid AND each of the nine
    // cells, standing will-change from the one-shot reveals, and a scroll-rotated
    // crest layer under the cards that forced everything above it to composite.
    const cost = await page.evaluate(async () => {
      const decks = document.querySelector('#decks')!;
      decks.scrollIntoView({ block: 'start' });
      await new Promise((r) => setTimeout(r, 1200));
      const nodes = [...decks.querySelectorAll('*')];
      return {
        perspective: nodes.filter((el) => getComputedStyle(el).perspective !== 'none').length,
        willChange: nodes.filter((el) => {
          const wc = getComputedStyle(el).willChange;
          return wc && wc !== 'auto';
        }).length,
        islands: decks.querySelectorAll('astro-island').length,
        cards: decks.querySelectorAll('.deck-card').length,
      };
    });

    expect(cost.cards).toBe(9);
    expect(cost.perspective).toBe(0);
    // Once the heading reveal has played nothing in the block asks for a layer.
    expect(cost.willChange).toBe(0);
    // Only the heading reveal hydrates; the grid and the crest are static HTML.
    expect(cost.islands).toBe(1);
  });
});

test.describe('nothing upstream keeps a layer over the decks block', () => {
  test('the phone section releases its compositor layers once scrolled past', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'pinned phone section is desktop-only');
    await page.goto('/');
    await hydrateWholePage(page);

    // The decks block itself measured clean, yet it still stuttered: the section
    // ABOVE it held seven full-size composited layers (three copy panels, three
    // canvases and the phone) for the whole session, because will-change was
    // declared standing rather than for the duration of a transition.
    const promoted = await page.evaluate(async () => {
      document.querySelector('.deck-grid')!.scrollIntoView({ block: 'center' });
      await new Promise((r) => setTimeout(r, 1200));
      const held = (sel: string) =>
        [...document.querySelectorAll(sel)].filter((el) => {
          const w = getComputedStyle(el).willChange;
          return w && w !== 'auto';
        }).length;
      return {
        // the standing, CSS-declared ones — these were the full-size layers
        standing: held('.tp-panel, .tp-canvas, .tp-phone'),
        page: held('*'),
      };
    });

    expect(promoted.standing).toBe(0);
    // Reveals that have not played yet legitimately keep the hint, and the
    // decorative Layers follow the same near/far rule as scroll measurement.
    expect(promoted.page).toBeLessThanOrEqual(12);
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
