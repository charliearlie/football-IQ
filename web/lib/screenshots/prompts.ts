import type { ScreenshotStyle } from './types';

const STYLE_PREAMBLE = `
You are creating an App Store screenshot for a mobile app called "Football IQ".

STRICT VISUAL REQUIREMENTS:
- Background: Pure black (#000000), solid fill, absolutely no navy or dark blue tints
- Primary accent color: Bright neon green (#2EFC5D) for highlights, buttons, and decorative elements
- Text color: Pure white (#FFFFFF)
- Headlines: Bold, uppercase, condensed sans-serif font (like Bebas Neue) — tall, narrow letterforms
- Body text: Clean geometric sans-serif (like Outfit) — round, modern letterforms
- Numbers/stats: Monospaced geometric font (like Space Grotesk)
- Overall aesthetic: Premium, dark sports app with a modern, clean look. Think ESPN meets Wordle.
- Style is minimal and confident — lots of breathing room, no clutter

OUTPUT REQUIREMENTS:
- Aspect ratio: 9:16 (portrait, tall)
- This must look like a POLISHED App Store marketing screenshot, NOT a raw phone capture
- Display the provided app screen inside a realistic phone mockup (rounded corners, thin bezels)
- Add the marketing text exactly as specified — no extra text
- Keep generous whitespace/padding around elements
- The phone screen content must be clearly visible and not distorted
`.trim();

const LAYOUT_INSTRUCTIONS: Record<ScreenshotStyle, string> = {
  hero: `
LAYOUT: "Hero" style
- Phone mockup centered horizontally, positioned in the lower 60% of the canvas, with a subtle 5-10 degree tilt
- Headline text large, bold, and uppercase at the top 20% of the canvas, centered
- Subtitle (if provided) directly below the headline in smaller white text
- Subtle neon green glow/reflection beneath the phone
- Small "Football IQ" text or wordmark near the very top
- The phone should feel like it's floating above the dark background
  `.trim(),

  feature: `
LAYOUT: "Feature Highlight" style
- Phone mockup positioned on the right side, taking about 40% of the canvas width, straight (no tilt)
- Headline text on the left side, left-aligned, large and bold, uppercase
- Subtitle (if provided) underneath the headline in smaller white text with some opacity
- A thin neon green (#2EFC5D) accent line or geometric element between text and phone areas
- Bottom of canvas: small "Football IQ" branding text
  `.trim(),

  'game-mode': `
LAYOUT: "Game Mode Showcase" style
- Phone mockup centered horizontally, straight (no tilt), occupying the middle ~55% of the canvas height
- Headline text centered above the phone, bold and uppercase
- A neon green (#2EFC5D) pill/badge shape behind or near the headline for emphasis
- Subtitle (if provided) below the headline, above the phone
- Bottom of canvas: small "Football IQ" branding
  `.trim(),

  'social-proof': `
LAYOUT: "Social Proof" style
- Phone mockup centered, slightly smaller than other layouts, in the lower half of the canvas
- Large bold headline at the top center
- Five star icons in neon green (#2EFC5D) arranged horizontally below the headline
- Subtitle (if provided) as a quote-style testimonial below the stars
- Clean, trustworthy feel — minimal decorative elements
  `.trim(),

  progression: `
LAYOUT: "Progression/Tiers" style
- Phone mockup on the left side of the canvas, taking about 40% width
- Right side shows a vertical progression of tier levels as small cards or badges
- Use neon green (#2EFC5D) for the active/current tier, dimmer white/grey for others
- Tier names from bottom to top: Intern, Scout, Tactical Analyst, Director of Football, The Gaffer
- Headline spans the top of the canvas, bold and uppercase
- Subtle connecting lines between tier levels
  `.trim(),
};

const CRITICAL_INSTRUCTIONS = `
CRITICAL:
- The provided image is the actual app screen. Display it ON the phone screen, not as a separate element.
- DO NOT add any text that wasn't specified above.
- DO NOT use any colors outside the specified palette (#000000, #2EFC5D, #FFFFFF, and subtle greys). The background MUST be pure black (#000000), not dark navy or dark blue.
- Make it look like it belongs in the top charts of the App Store.
- Ensure high contrast and readability — this will be viewed at small sizes on phones.
- No watermarks, no borders around the overall image, no decorative patterns that distract from the phone.
`.trim();

export function buildPrompt(
  style: ScreenshotStyle,
  headline: string,
  subtitle?: string,
): string {
  const parts = [
    STYLE_PREAMBLE,
    '',
    LAYOUT_INSTRUCTIONS[style],
    '',
    `HEADLINE TEXT: "${headline}"`,
  ];

  if (subtitle) {
    parts.push(`SUBTITLE TEXT: "${subtitle}"`);
  }

  parts.push('', CRITICAL_INSTRUCTIONS);

  return parts.join('\n');
}
