/**
 * Home Nation Flag SVGs
 *
 * GB subdivision flags (GB-ENG, GB-SCT, GB-WLS, GB-NIR) are not available
 * in standard flag icon libraries. These are simple, clean SVG representations.
 *
 * All flags use a 3:2 aspect ratio (viewBox 0 0 60 40).
 */

/** England - St George's Cross (white background, red cross) */
export const FLAG_GB_ENG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40">
  <rect width="60" height="40" fill="#FFFFFF"/>
  <rect x="24" y="0" width="12" height="40" fill="#CE1124"/>
  <rect x="0" y="14" width="60" height="12" fill="#CE1124"/>
</svg>`;

/** Scotland - St Andrew's Cross (blue background, white saltire) */
export const FLAG_GB_SCT = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40">
  <rect width="60" height="40" fill="#005EB8"/>
  <path d="M0 0L60 40M60 0L0 40" stroke="#FFFFFF" stroke-width="6"/>
</svg>`;

/** Wales - White and green halves with red dragon (simplified) */
export const FLAG_GB_WLS = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40">
  <rect width="60" height="20" fill="#FFFFFF"/>
  <rect y="20" width="60" height="20" fill="#00AB39"/>
  <path d="M20 10C22 8 26 6 30 8C32 6 36 6 38 8C40 6 42 8 42 12C42 16 38 20 34 22L30 28L26 22C22 20 18 16 18 12C18 10 19 9 20 10Z" fill="#D4351C"/>
</svg>`;

/** Northern Ireland - St Patrick's Saltire (white background, red saltire) */
export const FLAG_GB_NIR = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40">
  <rect width="60" height="40" fill="#FFFFFF"/>
  <path d="M0 0L60 40M60 0L0 40" stroke="#CE1124" stroke-width="5"/>
</svg>`;

/** Map of GB subdivision codes to SVG strings */
export const HOME_NATION_FLAGS: Record<string, string> = {
  'GB-ENG': FLAG_GB_ENG,
  'GB-SCT': FLAG_GB_SCT,
  'GB-WLS': FLAG_GB_WLS,
  'GB-NIR': FLAG_GB_NIR,
};
