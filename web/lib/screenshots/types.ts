export type ScreenshotStyle =
  | 'hero'
  | 'feature'
  | 'game-mode'
  | 'social-proof'
  | 'progression';

export interface GenerateRequest {
  /** Base64-encoded PNG/JPEG of the mobile screenshot */
  screenshotBase64: string;
  mimeType: 'image/png' | 'image/jpeg';
  style: ScreenshotStyle;
  headline: string;
  subtitle?: string;
}

export interface GenerateResponse {
  imageBase64: string;
  generationTimeMs: number;
}

export const SCREENSHOT_STYLES: {
  value: ScreenshotStyle;
  label: string;
  description: string;
  suggestedHeadline: string;
}[] = [
  {
    value: 'hero',
    label: 'Hero',
    description: 'Phone mockup with tilt, big headline at top, neon glow',
    suggestedHeadline: '11 Daily Football Games',
  },
  {
    value: 'feature',
    label: 'Feature Highlight',
    description: 'Phone right, headline left, accent separator',
    suggestedHeadline: 'Guess The Footballer',
  },
  {
    value: 'game-mode',
    label: 'Game Mode Showcase',
    description: 'Phone centered, headline above, green badge',
    suggestedHeadline: 'Career Path',
  },
  {
    value: 'social-proof',
    label: 'Social Proof',
    description: 'Phone smaller, star rating and review emphasis',
    suggestedHeadline: 'Loved By Football Fans',
  },
  {
    value: 'progression',
    label: 'Progression',
    description: 'Phone left, tier ladder right',
    suggestedHeadline: 'Climb The Ranks',
  },
];
