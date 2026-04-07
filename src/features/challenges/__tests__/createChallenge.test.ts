/**
 * createChallenge Tests
 *
 * Tests the challenge creation service function, covering:
 * - Successful challenge creation with correct fetch payload
 * - Returns null when user is not authenticated
 * - Returns null when the API responds with an error status
 * - Handles fetch failures (network errors) gracefully
 */

import { createChallenge, CreateChallengeInput } from '../createChallenge';

// The global supabase mock in jest-setup.ts does not include getUser.
// We extend it here by re-opening the mock for this test file.
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
  },
}));

// Import supabase AFTER the mock declaration so we get the mocked version.
import { supabase } from '@/lib/supabase';
const mockGetUser = supabase.auth.getUser as jest.Mock;

// Capture the global fetch mock
const mockFetch = jest.fn();
global.fetch = mockFetch;

const CHALLENGE_API_URL = 'https://www.football-iq.app/api/challenges';

const validInput: CreateChallengeInput = {
  gameMode: 'career_path',
  puzzleId: 'puzzle-abc-123',
  puzzleDate: '2026-04-03',
  score: 850,
  scoreDisplay: '850 pts',
  metadata: { difficulty: 'medium' },
};

describe('createChallenge', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when user is authenticated', () => {
    const mockUser = { id: 'user-id-xyz', email: 'user@example.com' };

    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
    });

    it('calls fetch with POST method and correct URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'challenge-1', url: 'https://football-iq.app/c/challenge-1' }),
      });

      await createChallenge(validInput);

      expect(mockFetch).toHaveBeenCalledWith(
        CHALLENGE_API_URL,
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('sends Content-Type: application/json header', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'c1', url: 'https://football-iq.app/c/c1' }),
      });

      await createChallenge(validInput);

      const [, options] = mockFetch.mock.calls[0];
      expect(options.headers).toMatchObject({ 'Content-Type': 'application/json' });
    });

    it('includes challengerId from the authenticated user in the payload', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'c1', url: 'https://football-iq.app/c/c1' }),
      });

      await createChallenge(validInput);

      const [, options] = mockFetch.mock.calls[0];
      const body = JSON.parse(options.body);
      expect(body.challengerId).toBe(mockUser.id);
    });

    it('includes all input fields in the request body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'c1', url: 'https://football-iq.app/c/c1' }),
      });

      await createChallenge(validInput);

      const [, options] = mockFetch.mock.calls[0];
      const body = JSON.parse(options.body);

      expect(body).toMatchObject({
        challengerId: mockUser.id,
        gameMode: validInput.gameMode,
        puzzleId: validInput.puzzleId,
        puzzleDate: validInput.puzzleDate,
        score: validInput.score,
        scoreDisplay: validInput.scoreDisplay,
        metadata: validInput.metadata,
      });
    });

    it('returns ChallengeResult with id and url on success', async () => {
      const expectedResult = {
        id: 'challenge-abc',
        url: 'https://football-iq.app/c/challenge-abc',
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => expectedResult,
      });

      const result = await createChallenge(validInput);

      expect(result).toEqual(expectedResult);
    });

    it('returns null when the API responds with a non-ok status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
        json: async () => ({ error: 'Internal Server Error' }),
      });

      const result = await createChallenge(validInput);

      expect(result).toBeNull();
    });

    it('returns null when the API responds with 422 (validation error)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
        text: async () => 'Invalid puzzle ID',
        json: async () => ({ error: 'Invalid puzzle ID' }),
      });

      const result = await createChallenge(validInput);

      expect(result).toBeNull();
    });

    it('returns null when fetch throws a network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network request failed'));

      const result = await createChallenge(validInput);

      expect(result).toBeNull();
    });

    it('returns null when fetch throws TypeError (no internet)', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

      const result = await createChallenge(validInput);

      expect(result).toBeNull();
    });

    it('works with minimal input (no optional fields)', async () => {
      const minimalInput: CreateChallengeInput = {
        gameMode: 'the_grid',
        puzzleId: 'puzzle-minimal',
        score: 0,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'c-min', url: 'https://football-iq.app/c/c-min' }),
      });

      const result = await createChallenge(minimalInput);

      expect(result).toEqual({ id: 'c-min', url: 'https://football-iq.app/c/c-min' });
    });

    it('sends puzzleDate as undefined when not provided', async () => {
      const inputWithoutDate: CreateChallengeInput = {
        gameMode: 'the_chain',
        puzzleId: 'puzzle-no-date',
        score: 100,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'c2', url: 'https://football-iq.app/c/c2' }),
      });

      await createChallenge(inputWithoutDate);

      const [, options] = mockFetch.mock.calls[0];
      const body = JSON.parse(options.body);

      // puzzleDate should not appear (undefined is stripped by JSON.stringify)
      expect(body.puzzleDate).toBeUndefined();
    });
  });

  describe('when user is not authenticated', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });
    });

    it('returns null without calling fetch', async () => {
      const result = await createChallenge(validInput);

      expect(result).toBeNull();
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('when getUser throws', () => {
    it('returns null gracefully when auth call fails', async () => {
      mockGetUser.mockRejectedValueOnce(
        new Error('Auth service unavailable')
      );

      const result = await createChallenge(validInput);

      expect(result).toBeNull();
    });
  });
});
