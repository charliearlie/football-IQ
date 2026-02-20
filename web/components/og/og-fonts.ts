/**
 * Shared font loader for OG image generation via Satori.
 *
 * Satori cannot use next/font — it needs raw font ArrayBuffer data.
 * Font files are co-located with this module so Webpack/Turbopack bundles
 * them as assets via the `new URL('./file', import.meta.url)` pattern.
 *
 * Compatible with both edge runtime (OG routes) and Node.js runtime (CRON route).
 */

export interface OGFont {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 600;
  style: 'normal';
}

// Module-level cache so fonts are only loaded once per cold start
let fontCache: OGFont[] | null = null;

/**
 * Load Montserrat (Regular + SemiBold) and Bebas Neue font data for Satori.
 * Results are cached in memory after first load.
 */
export async function loadOGFonts(): Promise<OGFont[]> {
  if (fontCache) return fontCache;

  const [montserratRegular, montserratSemiBold, bebasNeue] = await Promise.all([
    fetch(new URL('./Montserrat-Regular.ttf', import.meta.url)).then((r) => r.arrayBuffer()),
    fetch(new URL('./Montserrat-SemiBold.ttf', import.meta.url)).then((r) => r.arrayBuffer()),
    fetch(new URL('./BebasNeue-Regular.ttf', import.meta.url)).then((r) => r.arrayBuffer()),
  ]);

  fontCache = [
    { name: 'Montserrat', data: montserratRegular, weight: 400, style: 'normal' },
    { name: 'Montserrat', data: montserratSemiBold, weight: 600, style: 'normal' },
    { name: 'Bebas Neue', data: bebasNeue, weight: 400, style: 'normal' },
  ];

  return fontCache;
}
