// Vanilla scroll-progress (replaces framer-motion's useScroll). Exposes a small
// MotionValue-compatible surface — get() + on('change', cb) — so consumers
// (CanvasSequence, Layer) need no changes beyond the source. Progress 0..1 is
// computed from the element's rect vs the viewport using framer-style offsets,
// e.g. ['start end','end start'] (default) or ['start start','end end'].
type Cb = (v: number) => void;

export interface ScrollValue {
  get(): number;
  on(ev: 'change', cb: Cb): () => void;
  attach(el: HTMLElement | null): void;
  destroy(): void;
}

function edge(s: string): number {
  if (s === 'start') return 0;
  if (s === 'end') return 1;
  if (s === 'center') return 0.5;
  if (s.endsWith('%')) return parseFloat(s) / 100;
  return parseFloat(s) || 0;
}
function parse(o: string): [number, number] {
  const [a, b] = o.trim().split(/\s+/);
  return [edge(a), edge(b ?? 'start')];
}

const items = new Set<Item>();
let scheduled = false;
let listening = false;
let lastW = typeof window !== 'undefined' ? window.innerWidth : 0;

// Two passes, never interleaved: measure EVERY item first, then notify. A single
// combined pass read a rect, ran subscribers that wrote transforms, then read the
// next rect — each of those reads forced a synchronous layout, so one scroll frame
// cost as many layouts as there are scroll-driven elements on the page.
function tick() {
  scheduled = false;
  items.forEach((i) => i.measure());
  items.forEach((i) => i.commit());
}
function schedule() {
  if (scheduled || typeof requestAnimationFrame === 'undefined') return;
  scheduled = true;
  requestAnimationFrame(tick);
}
function onResize() {
  // Mobile browser chrome / Telegram address bar show-hide fires resize with only
  // a height change — recomputing then causes scroll jank. React only to width
  // (orientation) changes; svh-based geometry stays stable on height-only changes.
  const w = window.innerWidth;
  if (w !== lastW) {
    lastW = w;
    schedule();
  }
}
function listen() {
  if (listening || typeof window === 'undefined') return;
  listening = true;
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', onResize);
}

// Items park when their element is more than a viewport away: an item's progress
// is clamped to 0/1 out there anyway, so measuring it every frame bought nothing
// and cost a rect read each. One shared observer keeps that check off the scroll
// path; `near` starts true so an item still resolves before the observer reports.
const NEAR_MARGIN = '100% 0px 100% 0px';
let nearObserver: IntersectionObserver | null = null;
const byElement = new WeakMap<Element, Item>();

function observeNear(item: Item, el: HTMLElement) {
  if (typeof IntersectionObserver === 'undefined') return;
  if (!nearObserver) {
    nearObserver = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const it = byElement.get(e.target);
          if (!it) continue;
          it.setNear(e.isIntersecting);
        }
      },
      { rootMargin: NEAR_MARGIN }
    );
  }
  byElement.set(el, item);
  nearObserver.observe(el);
}

class Item implements ScrollValue {
  private el: HTMLElement | null = null;
  private xs: number; private ys: number; private xe: number; private ye: number;
  private v = 0;
  private pending = 0;
  private dirty = false;
  private near = true;
  private subs = new Set<Cb>();
  constructor(offset: [string, string]) {
    [this.xs, this.ys] = parse(offset[0]);
    [this.xe, this.ye] = parse(offset[1]);
  }
  attach(el: HTMLElement | null) {
    this.el = el;
    if (!el) return;
    items.add(this);
    listen();
    observeNear(this, el);
    if (typeof requestAnimationFrame !== 'undefined') requestAnimationFrame(() => this.update());
  }
  setNear(near: boolean) {
    this.near = near;
    // One last measurement on the way out pins the value at its clamped end, so a
    // parked item never keeps a stale mid-range progress.
    if (near) schedule();
    else this.update();
  }
  measure(force = false) {
    if (!this.el || (!this.near && !force)) return;
    const r = this.el.getBoundingClientRect();
    const vp = window.innerHeight || 1;
    const h = r.height || 1;
    const num = this.ys * vp - r.top - this.xs * h;
    const den = (this.xe - this.xs) * h - (this.ye - this.ys) * vp;
    let p = den !== 0 ? num / den : 0;
    p = p < 0 ? 0 : p > 1 ? 1 : p;
    if (p !== this.v) {
      this.pending = p;
      this.dirty = true;
    }
  }
  commit() {
    if (!this.dirty) return;
    this.dirty = false;
    this.v = this.pending;
    this.subs.forEach((cb) => cb(this.v));
  }
  update() {
    this.measure(true);
    this.commit();
  }
  get() { return this.v; }
  on(_ev: 'change', cb: Cb) { this.subs.add(cb); return () => this.subs.delete(cb); }
  destroy() {
    items.delete(this);
    this.subs.clear();
    if (this.el) {
      nearObserver?.unobserve(this.el);
      byElement.delete(this.el);
    }
    this.el = null;
  }
}

export function createScrollValue(offset: [string, string] = ['start end', 'end start']): ScrollValue {
  return new Item(offset);
}
