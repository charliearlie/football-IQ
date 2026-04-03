/**
 * push.ts Tests (Vitest)
 *
 * Tests for the server-side push notification utilities:
 * - sendPushBatch: batching, empty token list, fetch failures
 * - validateCronSecret: auth header validation
 *
 * Note: getTokensForSegment and logSentNotification are not tested here
 * as they require a full Supabase admin client — they are covered by
 * integration tests.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendPushBatch, validateCronSecret } from '../push';

// Mock the Supabase admin client (imported but not used in the tested functions)
vi.mock('@/lib/supabase/server', () => ({
  createAdminClient: vi.fn(),
}));

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

// Build a mock Response helper
function mockOkResponse(tickets: { status: string }[]) {
  return {
    ok: true,
    json: async () => ({ data: tickets }),
  } as unknown as Response;
}

function mockErrorResponse(status = 500) {
  return {
    ok: false,
    status,
    json: async () => ({ error: 'Server error' }),
  } as unknown as Response;
}

describe('sendPushBatch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset env
    delete process.env.EXPO_PUSH_ACCESS_TOKEN;
  });

  describe('empty token list', () => {
    it('returns zero counts without making any fetch calls', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch');

      const result = await sendPushBatch([], 'Title', 'Body');

      expect(result).toEqual({ sent: 0, failed: 0, total: 0 });
      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });

  describe('single batch (≤100 tokens)', () => {
    it('sends a single POST to the Expo push URL', async () => {
      const fetchSpy = vi
        .spyOn(global, 'fetch')
        .mockResolvedValueOnce(mockOkResponse([{ status: 'ok' }, { status: 'ok' }]));

      await sendPushBatch(['token-1', 'token-2'], 'Hello', 'World');

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(fetchSpy).toHaveBeenCalledWith(
        EXPO_PUSH_URL,
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('sends JSON body with correct message shape', async () => {
      const fetchSpy = vi
        .spyOn(global, 'fetch')
        .mockResolvedValueOnce(mockOkResponse([{ status: 'ok' }]));

      await sendPushBatch(['ExponentPushToken[abc]'], 'Test Title', 'Test Body');

      const [, options] = fetchSpy.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(options.body as string);

      expect(body).toHaveLength(1);
      expect(body[0]).toMatchObject({
        to: 'ExponentPushToken[abc]',
        title: 'Test Title',
        body: 'Test Body',
        sound: 'default',
      });
    });

    it('includes data payload when provided', async () => {
      const fetchSpy = vi
        .spyOn(global, 'fetch')
        .mockResolvedValueOnce(mockOkResponse([{ status: 'ok' }]));

      await sendPushBatch(['token-1'], 'T', 'B', { type: 'daily_reminder' });

      const [, options] = fetchSpy.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(options.body as string);

      expect(body[0].data).toEqual({ type: 'daily_reminder' });
    });

    it('omits data property when not provided', async () => {
      const fetchSpy = vi
        .spyOn(global, 'fetch')
        .mockResolvedValueOnce(mockOkResponse([{ status: 'ok' }]));

      await sendPushBatch(['token-1'], 'T', 'B');

      const [, options] = fetchSpy.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(options.body as string);

      expect(body[0].data).toBeUndefined();
    });

    it('counts ok tickets as sent and error tickets as failed', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce(
        mockOkResponse([{ status: 'ok' }, { status: 'error' }, { status: 'ok' }])
      );

      const result = await sendPushBatch(['t1', 't2', 't3'], 'T', 'B');

      expect(result.sent).toBe(2);
      expect(result.failed).toBe(1);
      expect(result.total).toBe(3);
    });

    it('adds auth header when EXPO_PUSH_ACCESS_TOKEN is set', async () => {
      process.env.EXPO_PUSH_ACCESS_TOKEN = 'secret-token';

      const fetchSpy = vi
        .spyOn(global, 'fetch')
        .mockResolvedValueOnce(mockOkResponse([{ status: 'ok' }]));

      await sendPushBatch(['token-1'], 'T', 'B');

      const [, options] = fetchSpy.mock.calls[0] as [string, RequestInit];
      expect((options.headers as Record<string, string>)['Authorization']).toBe(
        'Bearer secret-token'
      );
    });

    it('omits auth header when EXPO_PUSH_ACCESS_TOKEN is not set', async () => {
      const fetchSpy = vi
        .spyOn(global, 'fetch')
        .mockResolvedValueOnce(mockOkResponse([{ status: 'ok' }]));

      await sendPushBatch(['token-1'], 'T', 'B');

      const [, options] = fetchSpy.mock.calls[0] as [string, RequestInit];
      expect((options.headers as Record<string, string>)['Authorization']).toBeUndefined();
    });
  });

  describe('batching (>100 tokens)', () => {
    it('splits 250 tokens into 3 batches of 100, 100, 50', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(
        mockOkResponse(Array(100).fill({ status: 'ok' }))
      );

      const tokens = Array.from({ length: 250 }, (_, i) => `token-${i}`);
      const result = await sendPushBatch(tokens, 'T', 'B');

      expect(fetchSpy).toHaveBeenCalledTimes(3);
      expect(result.total).toBe(250);
    });

    it('sends exactly 100 tokens per batch', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(
        mockOkResponse(Array(100).fill({ status: 'ok' }))
      );

      const tokens = Array.from({ length: 150 }, (_, i) => `token-${i}`);
      await sendPushBatch(tokens, 'T', 'B');

      const firstBatch = JSON.parse(
        (fetchSpy.mock.calls[0][1] as RequestInit).body as string
      );
      const secondBatch = JSON.parse(
        (fetchSpy.mock.calls[1][1] as RequestInit).body as string
      );

      expect(firstBatch).toHaveLength(100);
      expect(secondBatch).toHaveLength(50);
    });

    it('accumulates sent/failed counts across all batches', async () => {
      vi.spyOn(global, 'fetch')
        .mockResolvedValueOnce(
          mockOkResponse(Array(100).fill({ status: 'ok' }))
        )
        .mockResolvedValueOnce(
          mockOkResponse([
            ...Array(80).fill({ status: 'ok' }),
            ...Array(20).fill({ status: 'error' }),
          ])
        );

      const tokens = Array.from({ length: 200 }, (_, i) => `token-${i}`);
      const result = await sendPushBatch(tokens, 'T', 'B');

      expect(result.sent).toBe(180);
      expect(result.failed).toBe(20);
      expect(result.total).toBe(200);
    });

    it('continues processing remaining batches after a batch fails', async () => {
      vi.spyOn(global, 'fetch')
        .mockResolvedValueOnce(mockErrorResponse(500))
        .mockResolvedValueOnce(mockOkResponse(Array(50).fill({ status: 'ok' })));

      const tokens = Array.from({ length: 150 }, (_, i) => `token-${i}`);
      const result = await sendPushBatch(tokens, 'T', 'B');

      // First batch of 100 failed (all counted as failed), second batch of 50 succeeded
      expect(result.failed).toBe(100);
      expect(result.sent).toBe(50);
      expect(result.total).toBe(150);
    });
  });

  describe('fetch failure handling', () => {
    it('returns all tokens as failed when fetch throws a network error', async () => {
      vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network error'));

      const tokens = ['token-1', 'token-2', 'token-3'];
      const result = await sendPushBatch(tokens, 'T', 'B');

      expect(result.failed).toBe(3);
      expect(result.sent).toBe(0);
      expect(result.total).toBe(3);
    });

    it('does not throw when fetch fails — returns graceful result', async () => {
      vi.spyOn(global, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));

      await expect(sendPushBatch(['token-1'], 'T', 'B')).resolves.not.toThrow();
    });

    it('counts batch tokens as failed when the API returns non-ok status', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce(mockErrorResponse(429));

      const result = await sendPushBatch(['t1', 't2'], 'T', 'B');

      expect(result.failed).toBe(2);
      expect(result.sent).toBe(0);
    });
  });
});

describe('validateCronSecret', () => {
  beforeEach(() => {
    delete process.env.CRON_SECRET;
  });

  it('returns false when CRON_SECRET env var is not set', () => {
    const request = new Request('https://example.com', {
      headers: { authorization: 'Bearer some-secret' },
    });

    expect(validateCronSecret(request)).toBe(false);
  });

  it('returns false when authorization header is missing', () => {
    process.env.CRON_SECRET = 'my-secret';
    const request = new Request('https://example.com');

    expect(validateCronSecret(request)).toBe(false);
  });

  it('returns false when authorization header has wrong value', () => {
    process.env.CRON_SECRET = 'correct-secret';
    const request = new Request('https://example.com', {
      headers: { authorization: 'Bearer wrong-secret' },
    });

    expect(validateCronSecret(request)).toBe(false);
  });

  it('returns false when bearer token format is incorrect', () => {
    process.env.CRON_SECRET = 'my-secret';
    const request = new Request('https://example.com', {
      headers: { authorization: 'my-secret' }, // Missing "Bearer " prefix
    });

    expect(validateCronSecret(request)).toBe(false);
  });

  it('returns true when authorization header matches the CRON_SECRET', () => {
    process.env.CRON_SECRET = 'my-cron-secret';
    const request = new Request('https://example.com', {
      headers: { authorization: 'Bearer my-cron-secret' },
    });

    expect(validateCronSecret(request)).toBe(true);
  });

  it('is case-sensitive — returns false for wrong case', () => {
    process.env.CRON_SECRET = 'My-Secret';
    const request = new Request('https://example.com', {
      headers: { authorization: 'Bearer my-secret' }, // lowercase
    });

    expect(validateCronSecret(request)).toBe(false);
  });

  it('returns false when CRON_SECRET is an empty string', () => {
    process.env.CRON_SECRET = '';
    const request = new Request('https://example.com', {
      headers: { authorization: 'Bearer ' },
    });

    // Empty string is falsy — should return false
    expect(validateCronSecret(request)).toBe(false);
  });
});
