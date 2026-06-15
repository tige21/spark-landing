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

function tick() {
  scheduled = false;
  items.forEach((i) => i.update());
}
function schedule() {
  if (scheduled || typeof requestAnimationFrame === 'undefined') return;
  scheduled = true;
  requestAnimationFrame(tick);
}
function listen() {
  if (listening || typeof window === 'undefined') return;
  listening = true;
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
}

class Item implements ScrollValue {
  private el: HTMLElement | null = null;
  private xs: number; private ys: number; private xe: number; private ye: number;
  private v = 0;
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
    if (typeof requestAnimationFrame !== 'undefined') requestAnimationFrame(() => this.update());
  }
  update() {
    if (!this.el) return;
    const r = this.el.getBoundingClientRect();
    const vp = window.innerHeight || 1;
    const h = r.height || 1;
    const num = this.ys * vp - r.top - this.xs * h;
    const den = (this.xe - this.xs) * h - (this.ye - this.ys) * vp;
    let p = den !== 0 ? num / den : 0;
    p = p < 0 ? 0 : p > 1 ? 1 : p;
    if (p !== this.v) {
      this.v = p;
      this.subs.forEach((cb) => cb(p));
    }
  }
  get() { return this.v; }
  on(_ev: 'change', cb: Cb) { this.subs.add(cb); return () => this.subs.delete(cb); }
  destroy() { items.delete(this); this.subs.clear(); this.el = null; }
}

export function createScrollValue(offset: [string, string] = ['start end', 'end start']): ScrollValue {
  return new Item(offset);
}
