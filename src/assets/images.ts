import type { ImageMetadata } from 'astro';

const pngModules = import.meta.glob<ImageMetadata>('./engravings/*.png', {
  eager: true,
  import: 'default',
});

const svgModules = import.meta.glob<string>('./engravings/*.svg', {
  eager: true,
  import: 'default',
  query: '?url',
});

function byName<T>(modules: Record<string, T>): Record<string, T> {
  const out: Record<string, T> = {};
  for (const [path, mod] of Object.entries(modules)) {
    const name = path.split('/').pop()!.replace(/\.(png|svg)$/, '');
    out[name] = mod;
  }
  return out;
}

export const engravings = byName(pngModules);
export const stamps = byName(svgModules);

export function engraving(name: string): ImageMetadata {
  const img = engravings[name];
  if (!img) throw new Error(`Engraving not found: ${name}`);
  return img;
}

export function stamp(name: string): string {
  const url = stamps[name];
  if (!url) throw new Error(`Stamp not found: ${name}`);
  return url;
}
