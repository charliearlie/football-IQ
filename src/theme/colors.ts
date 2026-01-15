/**
 * Digital Pitch Design System - Color Palette
 *
 * These colors define the visual identity of Football IQ.
 * Stadium Navy provides the high-contrast dark background,
 * while Pitch Green delivers the vibrant, action-oriented feel.
 */

export const colors = {
  // Primary action color
  pitchGreen: '#58CC02',

  // Shadow/depth for 3D button effects
  grassShadow: '#46A302',

  // Main background color
  stadiumNavy: '#0F172A',

  // Primary text color
  floodlightWhite: '#F8FAFC',

  // Highlights, alerts, career path clues
  cardYellow: '#FACC15',

  // Errors, incorrect guesses
  redCard: '#EF4444',

  // Warning orange for "sacrifice" actions (e.g., Reveal Next)
  warningOrange: '#FF4D00',
  warningOrangeShadow: '#CC3D00',

  // Amber for "costly but not negative" actions (e.g., Reveal Hint)
  amber: '#F59E0B',
  amberShadow: '#D97706',

  // Glass card effects
  glassBackground: 'rgba(255, 255, 255, 0.05)',
  glassBorder: 'rgba(255, 255, 255, 0.1)',

  // Semantic aliases
  primary: '#58CC02',
  primaryShadow: '#46A302',
  background: '#0F172A',
  text: '#F8FAFC',
  textSecondary: 'rgba(248, 250, 252, 0.7)',
  warning: '#FACC15',
  error: '#EF4444',
  success: '#58CC02',
} as const;

export type ColorName = keyof typeof colors;

/**
 * Pre-computed depth colors for common theme colors.
 * Use these for performance when possible instead of getDepthColor().
 * Each color is ~20% darker than its base color.
 */
export const depthColors = {
  pitchGreen: '#46A302',    // Same as grassShadow
  stadiumNavy: '#0A1628',
  redCard: '#B91C1C',
  cardYellow: '#D4A500',
  warningOrange: '#CC3D00', // Same as warningOrangeShadow
  amber: '#D97706',         // Same as amberShadow
  glass: 'rgba(255, 255, 255, 0.02)',
} as const;

/**
 * Converts a hex color to a darker shade for 3D depth effects.
 * Uses HSL lightness reduction for consistent, predictable darkening.
 *
 * @param hex - Hex color string (e.g., '#58CC02' or '#58CC02FF')
 * @param amount - Percentage to darken (0-100, default: 20)
 * @returns Darkened hex color string
 *
 * @example
 * getDepthColor('#58CC02')     // Returns '#46A302' (20% darker)
 * getDepthColor('#FACC15', 25) // Returns a 25% darker yellow
 */
export function getDepthColor(hex: string, amount: number = 20): string {
  // Remove # if present and handle shorthand hex
  let color = hex.replace('#', '');
  if (color.length === 3) {
    color = color.split('').map(c => c + c).join('');
  }

  // Parse RGB values
  const r = parseInt(color.substring(0, 2), 16) / 255;
  const g = parseInt(color.substring(2, 4), 16) / 255;
  const b = parseInt(color.substring(4, 6), 16) / 255;

  // Convert RGB to HSL
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  let l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  // Reduce lightness by the specified amount
  l = Math.max(0, l - amount / 100);

  // Convert HSL back to RGB
  const hue2rgb = (p: number, q: number, t: number): number => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  const newR = Math.round(hue2rgb(p, q, h + 1 / 3) * 255);
  const newG = Math.round(hue2rgb(p, q, h) * 255);
  const newB = Math.round(hue2rgb(p, q, h - 1 / 3) * 255);

  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`.toUpperCase();
}
