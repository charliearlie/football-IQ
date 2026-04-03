/**
 * constants.ts Tests (Vitest)
 *
 * Tests for the appStoreUrl UTM helper and base URL constants.
 */

import { describe, it, expect } from 'vitest';
import { appStoreUrl, APP_STORE_URL } from '../constants';

describe('APP_STORE_URL', () => {
  it('points to the correct App Store listing', () => {
    expect(APP_STORE_URL).toBe(
      'https://apps.apple.com/app/football-iq-daily-quiz-game/id6757344691'
    );
  });

  it('starts with the Apple App Store domain', () => {
    expect(APP_STORE_URL).toMatch(/^https:\/\/apps\.apple\.com\//);
  });
});

describe('appStoreUrl', () => {
  it('returns a URL containing the base APP_STORE_URL', () => {
    const url = appStoreUrl('web_home');
    expect(url).toContain(APP_STORE_URL);
  });

  it('appends mt=8 parameter', () => {
    const url = appStoreUrl('web_home');
    expect(url).toContain('mt=8');
  });

  it('appends ct parameter with the campaign name', () => {
    const url = appStoreUrl('web_home');
    expect(url).toContain('ct=web_home');
  });

  it('returns correct full URL for web_home campaign', () => {
    const url = appStoreUrl('web_home');
    expect(url).toBe(`${APP_STORE_URL}?mt=8&ct=web_home`);
  });

  it('returns correct full URL for blog campaign', () => {
    const url = appStoreUrl('blog_article');
    expect(url).toBe(`${APP_STORE_URL}?mt=8&ct=blog_article`);
  });

  it('URL-encodes spaces in campaign names', () => {
    const url = appStoreUrl('summer sale');
    expect(url).toContain('ct=summer%20sale');
    expect(url).not.toContain('ct=summer sale');
  });

  it('URL-encodes special characters in campaign names', () => {
    const url = appStoreUrl('campaign/2026&promo=yes');
    // encodeURIComponent encodes /, &, =
    expect(url).toContain('ct=campaign%2F2026%26promo%3Dyes');
  });

  it('handles campaign names with unicode characters', () => {
    const url = appStoreUrl('fußball');
    expect(url).toContain('ct=fu%C3%9Fball');
  });

  it('handles empty string campaign name', () => {
    const url = appStoreUrl('');
    expect(url).toBe(`${APP_STORE_URL}?mt=8&ct=`);
  });

  it('preserves the base APP_STORE_URL unchanged', () => {
    const url = appStoreUrl('test_campaign');
    expect(url.startsWith(APP_STORE_URL)).toBe(true);
  });

  it('produces a valid URL that can be parsed by the URL constructor', () => {
    const url = appStoreUrl('web_home');
    expect(() => new URL(url)).not.toThrow();
  });

  it('ct param is the last query parameter', () => {
    const url = appStoreUrl('my_campaign');
    const parsed = new URL(url);
    expect(parsed.searchParams.get('ct')).toBe('my_campaign');
    expect(parsed.searchParams.get('mt')).toBe('8');
  });

  it('produces different URLs for different campaign names', () => {
    const url1 = appStoreUrl('campaign_a');
    const url2 = appStoreUrl('campaign_b');
    expect(url1).not.toBe(url2);
  });
});
