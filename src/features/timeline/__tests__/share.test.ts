/**
 * Tests for Timeline share utilities.
 *
 * Covers generateTimelineEmojiRow and generateTimelineShareText.
 * The shareTimelineResult function (async, platform-dependent) is not covered here.
 */

// react-native and expo-clipboard are imported by share.ts but not used by the
// two pure functions under test. Mock them to keep the module loadable in Jest.
jest.mock('react-native', () => ({
  Share: {
    share: jest.fn(),
    sharedAction: 'sharedAction',
    dismissedAction: 'dismissedAction',
  },
  Platform: { OS: 'ios' },
}));

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(),
}));

import { generateTimelineEmojiRow, generateTimelineShareText } from '../utils/share';
import { TimelineScore } from '../types/timeline.types';

const makeScore = (overrides: Partial<TimelineScore> = {}): TimelineScore => ({
  points: 5,
  totalAttempts: 1,
  label: 'Perfect Timeline',
  ...overrides,
});

describe('generateTimelineEmojiRow', () => {
  it('generates all correct', () => {
    const result = generateTimelineEmojiRow([true, true, true, true, true, true]);
    expect(result).toBe('✅✅✅✅✅✅');
  });

  it('generates all incorrect', () => {
    const result = generateTimelineEmojiRow([false, false, false, false, false, false]);
    expect(result).toBe('❌❌❌❌❌❌');
  });

  it('generates mixed results', () => {
    const result = generateTimelineEmojiRow([true, false, true, true, false, true]);
    expect(result).toBe('✅❌✅✅❌✅');
  });

  it('handles empty array', () => {
    const result = generateTimelineEmojiRow([]);
    expect(result).toBe('');
  });
});

describe('generateTimelineShareText', () => {
  it('includes header and app URL', () => {
    const text = generateTimelineShareText([true], makeScore());
    expect(text).toContain('Football IQ - Timeline');
    expect(text).toContain('https://football-iq.app');
  });

  it('formats date with en-GB locale', () => {
    // '2026-02-19' should render as '19 Feb 2026' under en-GB locale
    const text = generateTimelineShareText([true], makeScore(), '2026-02-19');
    expect(text).toContain('19 Feb 2026');
  });

  it('uses "Today" when no date is provided', () => {
    const text = generateTimelineShareText([true], makeScore());
    expect(text).toContain('Today');
  });

  it('uses title over subject when both are present', () => {
    const text = generateTimelineShareText(
      [true],
      makeScore(),
      undefined,
      'Premier League Moments',
      'Thierry Henry',
    );
    expect(text).toContain('⏱️ Premier League Moments');
    expect(text).not.toContain('Thierry Henry');
  });

  it('uses subject when no title is provided', () => {
    const text = generateTimelineShareText(
      [true],
      makeScore(),
      undefined,
      undefined,
      'Thierry Henry',
    );
    expect(text).toContain('⏱️ Thierry Henry');
  });

  it('falls back to "Timeline" when neither title nor subject is provided', () => {
    const text = generateTimelineShareText([true], makeScore());
    expect(text).toContain('⏱️ Timeline');
  });

  it('includes score points and total attempt count', () => {
    const score = makeScore({ points: 3, totalAttempts: 3, label: 'Expert' });
    const text = generateTimelineShareText([true, false, true], score);
    expect(text).toContain('3/5 guesses - 3 IQ');
  });

  it('includes emoji row derived from first attempt results', () => {
    const text = generateTimelineShareText(
      [true, false, true, true, false, true],
      makeScore(),
    );
    expect(text).toContain('✅❌✅✅❌✅');
  });
});
