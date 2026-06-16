// Shared IntersectionObserver: adds `is-in` once an element scrolls into view
// (one-shot). Replaces framer-motion's whileInView for simple CSS reveals.
let io: IntersectionObserver | null = null;

function ensure(): IntersectionObserver | null {
  if (io || typeof IntersectionObserver === 'undefined') return io;
  io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io!.unobserve(e.target);
        }
      }
    },
    { rootMargin: '0px 0px 15% 0px', threshold: 0.05 }
  );
  return io;
}

// Observe `el`; it gets `.is-in` when visible. Returns an unobserve cleanup.
export function observeInView(el: Element | null): () => void {
  if (!el) return () => {};
  const o = ensure();
  if (!o) {
    el.classList.add('is-in'); // no IO support → just show
    return () => {};
  }
  o.observe(el);
  return () => o.unobserve(el);
}
