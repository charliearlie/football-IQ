import { colors } from '../colors';

/**
 * WCAG 2.1 Color Contrast Tests
 *
 * Ensures our color combinations meet accessibility standards:
 * - AA Normal Text: 4.5:1 contrast ratio
 * - AA Large Text: 3:1 contrast ratio
 * - AAA Normal Text: 7:1 contrast ratio
 */

/**
 * Convert hex color to RGB components
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  // Handle shorthand hex (#FFF)
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  const fullHex = hex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b);

  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Calculate relative luminance per WCAG 2.1
 * https://www.w3.org/WAI/GL/wiki/Relative_luminance
 */
function getLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;

  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Calculate contrast ratio between two colors
 * https://www.w3.org/WAI/GL/wiki/Contrast_ratio
 */
function getContrastRatio(color1: string, color2: string): number {
  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// WCAG 2.1 minimum contrast ratios
const WCAG_AA_NORMAL = 4.5;
const WCAG_AA_LARGE = 3.0;
const WCAG_AAA_NORMAL = 7.0;

describe('Color Contrast (WCAG 2.1)', () => {
  describe('Text on Stadium Navy background', () => {
    it('floodlightWhite meets AA for normal text', () => {
      const ratio = getContrastRatio(colors.floodlightWhite, colors.stadiumNavy);
      expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_NORMAL);
    });

    it('floodlightWhite meets AAA for normal text', () => {
      const ratio = getContrastRatio(colors.floodlightWhite, colors.stadiumNavy);
      expect(ratio).toBeGreaterThanOrEqual(WCAG_AAA_NORMAL);
    });

    it('pitchGreen meets AA for large text/UI components', () => {
      const ratio = getContrastRatio(colors.pitchGreen, colors.stadiumNavy);
      expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_LARGE);
    });

    it('cardYellow meets AA for large text', () => {
      const ratio = getContrastRatio(colors.cardYellow, colors.stadiumNavy);
      expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_LARGE);
    });

    it('redCard meets AA for large text', () => {
      const ratio = getContrastRatio(colors.redCard, colors.stadiumNavy);
      expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_LARGE);
    });
  });

  describe('Button text on colored backgrounds', () => {
    it('stadiumNavy text on pitchGreen background meets AA for large text', () => {
      const ratio = getContrastRatio(colors.stadiumNavy, colors.pitchGreen);
      expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_LARGE);
    });

    it('stadiumNavy text on cardYellow background meets AA for normal text', () => {
      const ratio = getContrastRatio(colors.stadiumNavy, colors.cardYellow);
      expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_NORMAL);
    });
  });

  describe('Contrast ratio calculations', () => {
    it('calculates white on black as ~21:1', () => {
      const ratio = getContrastRatio('#FFFFFF', '#000000');
      expect(ratio).toBeCloseTo(21, 0);
    });

    it('calculates same color as 1:1', () => {
      const ratio = getContrastRatio('#FF0000', '#FF0000');
      expect(ratio).toBe(1);
    });
  });
});

describe('Color utility functions', () => {
  it('hexToRgb parses standard hex colors', () => {
    expect(hexToRgb('#58CC02')).toEqual({ r: 88, g: 204, b: 2 });
    expect(hexToRgb('#0F172A')).toEqual({ r: 15, g: 23, b: 42 });
    expect(hexToRgb('#FFFFFF')).toEqual({ r: 255, g: 255, b: 255 });
  });

  it('hexToRgb handles shorthand hex', () => {
    expect(hexToRgb('#FFF')).toEqual({ r: 255, g: 255, b: 255 });
    expect(hexToRgb('#000')).toEqual({ r: 0, g: 0, b: 0 });
  });

  it('hexToRgb handles hex without #', () => {
    expect(hexToRgb('58CC02')).toEqual({ r: 88, g: 204, b: 2 });
  });

  it('getLuminance returns 0 for black', () => {
    expect(getLuminance('#000000')).toBe(0);
  });

  it('getLuminance returns 1 for white', () => {
    expect(getLuminance('#FFFFFF')).toBeCloseTo(1, 5);
  });
});
