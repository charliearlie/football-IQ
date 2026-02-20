/**
 * Shared font loader for OG image generation via Satori.
 *
 * Satori cannot use next/font — it needs raw font ArrayBuffer data.
 * Fonts are fetched from Google Fonts CDN at runtime to avoid inflating
 * edge function bundle size (bundling via import.meta.url adds ~400KB
 * per route, which exceeds Vercel's 1MB edge function limit).
 *
 * Results are cached in memory so fonts are only fetched once per cold start.
 */

export interface OGFont {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 600;
  style: 'normal';
}

// Google Fonts static CDN URLs (stable, versioned)
const FONT_URLS = {
  montserratRegular:
    'https://fonts.gstatic.com/s/montserrat/v31/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCtr6Ew-.ttf',
  montserratSemiBold:
    'https://fonts.gstatic.com/s/montserrat/v31/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCu170w-.ttf',
  bebasNeue:
    'https://fonts.gstatic.com/s/bebasneue/v16/JTUSjIg69CK48gW7PXooxW4.ttf',
} as const;

// Module-level cache so fonts are only fetched once per cold start
let fontCache: OGFont[] | null = null;

/**
 * Load Montserrat (Regular + SemiBold) and Bebas Neue font data for Satori.
 * Fetches from Google Fonts CDN on first call, then serves from memory cache.
 */
export async function loadOGFonts(): Promise<OGFont[]> {
  if (fontCache) return fontCache;

  const [montserratRegular, montserratSemiBold, bebasNeue] = await Promise.all([
    fetch(FONT_URLS.montserratRegular).then((r) => r.arrayBuffer()),
    fetch(FONT_URLS.montserratSemiBold).then((r) => r.arrayBuffer()),
    fetch(FONT_URLS.bebasNeue).then((r) => r.arrayBuffer()),
  ]);

  fontCache = [
    { name: 'Montserrat', data: montserratRegular, weight: 400, style: 'normal' },
    { name: 'Montserrat', data: montserratSemiBold, weight: 600, style: 'normal' },
    { name: 'Bebas Neue', data: bebasNeue, weight: 400, style: 'normal' },
  ];

  return fontCache;
}
