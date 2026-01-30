/**
 * RehydrationService Tests
 *
 * Tests for data rehydration from Supabase after app reinstall.
 * Simulates "fresh install" scenarios with empty SQLite but existing Supabase data.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { mockSupabaseFrom } from '../../../../jest-setup';
import {
  needsRehydration,
  performRehydration,
  DATA_FLOOR_DATE,
  MAX_ATTEMPTS_TO_PULL,
  REHYDRATION_FLAG_KEY,
} from '../services/RehydrationService';

// Mock database functions
const mockGetAttemptCount = jest.fn();
const mockSaveAttemptIfNotExists = jest.fn();
const mockSavePuzzle = jest.fn();

jest.mock('@/lib/database', () => ({
  getAttemptCount: () => mockGetAttemptCount(),
  saveAttemptIfNotExists: (...args: unknown[]) => mockSaveAttemptIfNotExists(...args),
  savePuzzle: (...args: unknown[]) => mockSavePuzzle(...args),
}));

describe('RehydrationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
  });

  describe('Constants', () => {
    it('has DATA_FLOOR_DATE set to January 20, 2026', () => {
      expect(DATA_FLOOR_DATE).toBe('2026-01-20');
    });

    it('has MAX_ATTEMPTS_TO_PULL set to 100', () => {
      expect(MAX_ATTEMPTS_TO_PULL).toBe(100);
    });
  });

  describe('needsRehydration', () => {
    it('returns true when SQLite is empty and Supabase has data', async () => {
      // SQLite empty
      mockGetAttemptCount.mockResolvedValue(0);

      // Supabase has data
      const mockGte = jest.fn().mockResolvedValue({ count: 5, error: null });
      const mockEq = jest.fn().mockReturnValue({ gte: mockGte });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      mockSupabaseFrom.mockReturnValue({ select: mockSelect });

      const result = await needsRehydration('user-123');

      expect(result).toBe(true);
      expect(mockGetAttemptCount).toHaveBeenCalled();
      expect(mockSupabaseFrom).toHaveBeenCalledWith('puzzle_attempts');
    });

    it('returns false when SQLite already has data', async () => {
      // SQLite has data
      mockGetAttemptCount.mockResolvedValue(5);

      const result = await needsRehydration('user-123');

      expect(result).toBe(false);
      // Should not check Supabase if local data exists
      expect(mockSupabaseFrom).not.toHaveBeenCalled();
    });

    it('returns false when already rehydrated this session', async () => {
      // SQLite empty
      mockGetAttemptCount.mockResolvedValue(0);

      // Already rehydrated
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('user-123');

      const result = await needsRehydration('user-123');

      expect(result).toBe(false);
    });

    it('returns false when Supabase has no data for this user', async () => {
      // SQLite empty
      mockGetAttemptCount.mockResolvedValue(0);

      // Supabase empty
      const mockGte = jest.fn().mockResolvedValue({ count: 0, error: null });
      const mockEq = jest.fn().mockReturnValue({ gte: mockGte });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      mockSupabaseFrom.mockReturnValue({ select: mockSelect });

      const result = await needsRehydration('user-123');

      expect(result).toBe(false);
    });

    it('returns false when no userId is provided', async () => {
      const result = await needsRehydration('');

      expect(result).toBe(false);
    });

    it('respects DATA_FLOOR_DATE in Supabase query', async () => {
      mockGetAttemptCount.mockResolvedValue(0);

      const mockGte = jest.fn().mockResolvedValue({ count: 0, error: null });
      const mockEq = jest.fn().mockReturnValue({ gte: mockGte });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      mockSupabaseFrom.mockReturnValue({ select: mockSelect });

      await needsRehydration('user-123');

      expect(mockGte).toHaveBeenCalledWith('started_at', DATA_FLOOR_DATE);
    });
  });

  describe('performRehydration', () => {
    const mockAttempts = [
      {
        id: 'attempt-1',
        puzzle_id: 'puzzle-1',
        completed: true,
        score: 8,
        score_display: '🟩🟩🟩⬛⬛',
        metadata: { guesses: 3 },
        started_at: '2026-01-21T10:00:00Z',
        completed_at: '2026-01-21T10:05:00Z',
        daily_puzzles: {
          id: 'puzzle-1',
          game_mode: 'career_path',
          puzzle_date: '2026-01-21',
          content: '{"answer": "Messi"}',
          difficulty: 'medium',
          updated_at: '2026-01-20T00:00:00Z',
        },
      },
      {
        id: 'attempt-2',
        puzzle_id: 'puzzle-2',
        completed: true,
        score: 10,
        score_display: '✅✅✅✅✅',
        metadata: null,
        started_at: '2026-01-22T10:00:00Z',
        completed_at: '2026-01-22T10:05:00Z',
        daily_puzzles: {
          id: 'puzzle-2',
          game_mode: 'topical_quiz',
          puzzle_date: '2026-01-22',
          content: '{"questions": []}',
          difficulty: 'easy',
          updated_at: '2026-01-21T00:00:00Z',
        },
      },
    ];

    it('fetches and inserts attempts into SQLite', async () => {
      const mockLimit = jest.fn().mockResolvedValue({ data: mockAttempts, error: null });
      const mockOrder = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockGte = jest.fn().mockReturnValue({ order: mockOrder });
      const mockEq = jest.fn().mockReturnValue({ gte: mockGte });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      mockSupabaseFrom.mockReturnValue({ select: mockSelect });

      const result = await performRehydration('user-123');

      expect(result.success).toBe(true);
      expect(result.attemptsRehydrated).toBe(2);
      expect(mockSavePuzzle).toHaveBeenCalledTimes(2);
      expect(mockSaveAttemptIfNotExists).toHaveBeenCalledTimes(2);
    });

    it('marks rehydrated attempts as synced=1', async () => {
      const mockLimit = jest.fn().mockResolvedValue({ data: [mockAttempts[0]], error: null });
      const mockOrder = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockGte = jest.fn().mockReturnValue({ order: mockOrder });
      const mockEq = jest.fn().mockReturnValue({ gte: mockGte });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      mockSupabaseFrom.mockReturnValue({ select: mockSelect });

      await performRehydration('user-123');

      expect(mockSaveAttemptIfNotExists).toHaveBeenCalledWith(
        expect.objectContaining({ synced: 1 })
      );
    });

    it('sets rehydration flag in AsyncStorage at start (to prevent retry loops)', async () => {
      const mockLimit = jest.fn().mockResolvedValue({ data: mockAttempts, error: null });
      const mockOrder = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockGte = jest.fn().mockReturnValue({ order: mockOrder });
      const mockEq = jest.fn().mockReturnValue({ gte: mockGte });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      mockSupabaseFrom.mockReturnValue({ select: mockSelect });

      await performRehydration('user-123');

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        REHYDRATION_FLAG_KEY,
        'user-123'
      );
    });

    it('respects DATA_FLOOR_DATE filter', async () => {
      const mockLimit = jest.fn().mockResolvedValue({ data: [], error: null });
      const mockOrder = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockGte = jest.fn().mockReturnValue({ order: mockOrder });
      const mockEq = jest.fn().mockReturnValue({ gte: mockGte });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      mockSupabaseFrom.mockReturnValue({ select: mockSelect });

      await performRehydration('user-123');

      expect(mockGte).toHaveBeenCalledWith('started_at', DATA_FLOOR_DATE);
    });

    it('limits to MAX_ATTEMPTS_TO_PULL', async () => {
      const mockLimit = jest.fn().mockResolvedValue({ data: [], error: null });
      const mockOrder = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockGte = jest.fn().mockReturnValue({ order: mockOrder });
      const mockEq = jest.fn().mockReturnValue({ gte: mockGte });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      mockSupabaseFrom.mockReturnValue({ select: mockSelect });

      await performRehydration('user-123');

      expect(mockLimit).toHaveBeenCalledWith(MAX_ATTEMPTS_TO_PULL);
    });

    it('orders by started_at descending (most recent first)', async () => {
      const mockLimit = jest.fn().mockResolvedValue({ data: [], error: null });
      const mockOrder = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockGte = jest.fn().mockReturnValue({ order: mockOrder });
      const mockEq = jest.fn().mockReturnValue({ gte: mockGte });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      mockSupabaseFrom.mockReturnValue({ select: mockSelect });

      await performRehydration('user-123');

      expect(mockOrder).toHaveBeenCalledWith('started_at', { ascending: false });
    });

    it('handles Supabase errors gracefully', async () => {
      const mockLimit = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });
      const mockOrder = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockGte = jest.fn().mockReturnValue({ order: mockOrder });
      const mockEq = jest.fn().mockReturnValue({ gte: mockGte });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      mockSupabaseFrom.mockReturnValue({ select: mockSelect });

      const result = await performRehydration('user-123');

      expect(result.success).toBe(false);
      expect(result.attemptsRehydrated).toBe(0);
      expect(result.error).toBeDefined();
    });

    it('handles null data gracefully', async () => {
      const mockLimit = jest.fn().mockResolvedValue({ data: null, error: null });
      const mockOrder = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockGte = jest.fn().mockReturnValue({ order: mockOrder });
      const mockEq = jest.fn().mockReturnValue({ gte: mockGte });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      mockSupabaseFrom.mockReturnValue({ select: mockSelect });

      const result = await performRehydration('user-123');

      expect(result.success).toBe(true);
      expect(result.attemptsRehydrated).toBe(0);
    });

    it('skips attempts without puzzle data (daily_puzzles is null) due to foreign key', async () => {
      const attemptWithoutPuzzle = {
        ...mockAttempts[0],
        daily_puzzles: null,
      };
      const mockLimit = jest.fn().mockResolvedValue({
        data: [attemptWithoutPuzzle],
        error: null,
      });
      const mockOrder = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockGte = jest.fn().mockReturnValue({ order: mockOrder });
      const mockEq = jest.fn().mockReturnValue({ gte: mockGte });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      mockSupabaseFrom.mockReturnValue({ select: mockSelect });

      const result = await performRehydration('user-123');

      // Should skip the attempt entirely due to foreign key constraint
      expect(result.success).toBe(true);
      expect(result.attemptsRehydrated).toBe(0);
      expect(mockSavePuzzle).not.toHaveBeenCalled();
      expect(mockSaveAttemptIfNotExists).not.toHaveBeenCalled();
    });
  });
});

describe('Fresh Install Simulation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
  });

  it('full rehydration flow: empty local → populated after rehydration', async () => {
    // Simulate fresh install: SQLite empty
    mockGetAttemptCount.mockResolvedValue(0);

    // Supabase has historical data
    const mockAttempts = [
      {
        id: 'historical-1',
        puzzle_id: 'p-1',
        completed: true,
        score: 10,
        score_display: '🟩🟩🟩🟩🟩',
        metadata: null,
        started_at: '2026-01-21T10:00:00Z',
        completed_at: '2026-01-21T10:05:00Z',
        daily_puzzles: {
          id: 'p-1',
          game_mode: 'career_path',
          puzzle_date: '2026-01-21',
          content: '{}',
          difficulty: 'medium',
          updated_at: '2026-01-20T00:00:00Z',
        },
      },
    ];

    // Setup mock chain for needsRehydration
    const mockGteCount = jest.fn().mockResolvedValue({ count: 1, error: null });
    const mockEqCount = jest.fn().mockReturnValue({ gte: mockGteCount });
    const mockSelectCount = jest.fn().mockReturnValue({ eq: mockEqCount });

    // Setup mock chain for performRehydration
    const mockLimit = jest.fn().mockResolvedValue({ data: mockAttempts, error: null });
    const mockOrder = jest.fn().mockReturnValue({ limit: mockLimit });
    const mockGte = jest.fn().mockReturnValue({ order: mockOrder });
    const mockEq = jest.fn().mockReturnValue({ gte: mockGte });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

    // First call for needsRehydration, second for performRehydration
    mockSupabaseFrom
      .mockReturnValueOnce({ select: mockSelectCount })
      .mockReturnValueOnce({ select: mockSelect });

    // Check if needs rehydration
    const needs = await needsRehydration('user-123');
    expect(needs).toBe(true);

    // Perform rehydration
    const result = await performRehydration('user-123');

    expect(result.success).toBe(true);
    expect(result.attemptsRehydrated).toBe(1);
    expect(mockSaveAttemptIfNotExists).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'historical-1',
        synced: 1,
      })
    );
  });
});
