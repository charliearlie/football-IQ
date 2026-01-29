/**
 * TDD tests for hybrid player search engine.
 * Tests written BEFORE implementation.
 *
 * Validates waterfall strategy:
 * 1. Local SQLite cache (instant)
 * 2. Debounced Supabase Oracle (300ms)
 * 3. Automatic caching of Oracle results
 */

import {
  searchPlayersHybrid,
  _resetForTesting,
} from '../HybridSearchEngine';
import * as playerSearch from '../playerSearch';
import * as WikidataService from '../../oracle/WikidataService';

jest.mock('../playerSearch');
jest.mock('../../oracle/WikidataService');
jest.mock('@/lib/database', () => ({
  getDatabase: jest.fn(() => ({
    runAsync: jest.fn().mockResolvedValue(undefined),
    getAllAsync: jest.fn().mockResolvedValue([]),
  })),
}));

describe('searchPlayersHybrid', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    _resetForTesting();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns empty for queries shorter than 3 characters', async () => {
    const onUpdate = jest.fn();
    await searchPlayersHybrid('ab', onUpdate);
    expect(onUpdate).toHaveBeenCalledWith([]);
  });

  it('returns empty for empty query', async () => {
    const onUpdate = jest.fn();
    await searchPlayersHybrid('', onUpdate);
    expect(onUpdate).toHaveBeenCalledWith([]);
  });

  it('returns local results immediately', async () => {
    const mockLocal = [
      {
        player: {
          id: '1',
          name: 'Lionel Messi',
          searchName: 'lionel messi',
          clubs: ['Barcelona'],
          nationalities: ['AR'],
          isActive: true,
          externalId: null,
          lastSyncedAt: null,
        },
        relevanceScore: 1.0,
      },
    ];
    (playerSearch.searchPlayers as jest.Mock).mockResolvedValue(mockLocal);

    const onUpdate = jest.fn();
    await searchPlayersHybrid('messi', onUpdate);

    expect(onUpdate).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'Lionel Messi',
          source: 'local',
        }),
      ])
    );
  });

  it('skips Oracle if local results >= 5', async () => {
    const mockLocal = Array(5)
      .fill(null)
      .map((_, i) => ({
        player: {
          id: `${i}`,
          name: `Player ${i}`,
          searchName: `player ${i}`,
          clubs: [],
          nationalities: [],
          isActive: true,
          externalId: null,
          lastSyncedAt: null,
        },
        relevanceScore: 1.0 - i * 0.1,
      }));
    (playerSearch.searchPlayers as jest.Mock).mockResolvedValue(mockLocal);

    const onUpdate = jest.fn();
    await searchPlayersHybrid('player', onUpdate);

    // Advance past debounce
    jest.advanceTimersByTime(400);

    expect(WikidataService.searchPlayersOracle).not.toHaveBeenCalled();
  });

  it('calls Oracle after debounce if local results < 5', async () => {
    (playerSearch.searchPlayers as jest.Mock).mockResolvedValue([]);
    (WikidataService.searchPlayersOracle as jest.Mock).mockResolvedValue([
      {
        id: 'Q11571',
        name: 'Cristiano Ronaldo',
        scout_rank: 207,
        birth_year: 1985,
        position_category: 'Forward',
        nationality_code: 'PT',
        relevance_score: 1.0,
      },
    ]);

    const onUpdate = jest.fn();
    await searchPlayersHybrid('ronaldo', onUpdate);

    // First call should be local results (empty)
    expect(onUpdate).toHaveBeenCalledWith([]);

    // Advance past debounce
    await jest.advanceTimersByTimeAsync(400);

    expect(WikidataService.searchPlayersOracle).toHaveBeenCalledWith('ronaldo');
    expect(onUpdate).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'Cristiano Ronaldo',
          source: 'oracle',
          nationality_code: 'PT',
        }),
      ])
    );
  });

  it('deduplicates results by name across sources', async () => {
    const mockLocal = [
      {
        player: {
          id: 'local-1',
          name: 'Cristiano Ronaldo',
          searchName: 'cristiano ronaldo',
          clubs: [],
          nationalities: ['PT'],
          isActive: true,
          externalId: null,
          lastSyncedAt: null,
        },
        relevanceScore: 0.9,
      },
    ];
    (playerSearch.searchPlayers as jest.Mock).mockResolvedValue(mockLocal);
    (WikidataService.searchPlayersOracle as jest.Mock).mockResolvedValue([
      {
        id: 'Q11571',
        name: 'Cristiano Ronaldo',
        scout_rank: 207,
        birth_year: 1985,
        position_category: 'Forward',
        nationality_code: 'PT',
        relevance_score: 1.0,
      },
    ]);

    const onUpdate = jest.fn();
    await searchPlayersHybrid('ronaldo', onUpdate);

    // Advance past debounce
    await jest.advanceTimersByTimeAsync(400);

    // Get the last call to onUpdate (after Oracle merge)
    const lastCallArgs = onUpdate.mock.calls[onUpdate.mock.calls.length - 1][0];

    // Should not have duplicate Cristiano Ronaldo
    const ronaldoCount = lastCallArgs.filter(
      (p: { name: string }) => p.name === 'Cristiano Ronaldo'
    ).length;
    expect(ronaldoCount).toBe(1);
  });

  it('handles Oracle errors gracefully', async () => {
    (playerSearch.searchPlayers as jest.Mock).mockResolvedValue([]);
    (WikidataService.searchPlayersOracle as jest.Mock).mockRejectedValue(
      new Error('Network error')
    );

    const onUpdate = jest.fn();
    await searchPlayersHybrid('messi', onUpdate);

    // Advance past debounce
    await jest.advanceTimersByTimeAsync(400);

    // Should not throw — initial empty results still returned
    expect(onUpdate).toHaveBeenCalledWith([]);
  });

  it('maps local player fields to UnifiedPlayer format', async () => {
    const mockLocal = [
      {
        player: {
          id: '42',
          name: 'Thierry Henry',
          searchName: 'thierry henry',
          clubs: ['Arsenal', 'Barcelona'],
          nationalities: ['FR'],
          isActive: false,
          externalId: 100,
          lastSyncedAt: null,
        },
        relevanceScore: 0.95,
      },
    ];
    (playerSearch.searchPlayers as jest.Mock).mockResolvedValue(mockLocal);

    const onUpdate = jest.fn();
    await searchPlayersHybrid('henry', onUpdate);

    expect(onUpdate).toHaveBeenCalledWith([
      expect.objectContaining({
        id: '42',
        name: 'Thierry Henry',
        nationality_code: 'FR',
        birth_year: null,
        position_category: null,
        source: 'local',
        relevance_score: 0.95,
      }),
    ]);
  });

  it('limits merged results to 10', async () => {
    const mockLocal = Array(3)
      .fill(null)
      .map((_, i) => ({
        player: {
          id: `local-${i}`,
          name: `Local Player ${i}`,
          searchName: `local player ${i}`,
          clubs: [],
          nationalities: [],
          isActive: true,
          externalId: null,
          lastSyncedAt: null,
        },
        relevanceScore: 0.5,
      }));

    const mockOracle = Array(10)
      .fill(null)
      .map((_, i) => ({
        id: `Q${i}`,
        name: `Oracle Player ${i}`,
        scout_rank: 100 - i,
        birth_year: 1990,
        position_category: 'Forward',
        nationality_code: 'FR',
        relevance_score: 0.9,
      }));

    (playerSearch.searchPlayers as jest.Mock).mockResolvedValue(mockLocal);
    (WikidataService.searchPlayersOracle as jest.Mock).mockResolvedValue(mockOracle);

    const onUpdate = jest.fn();
    await searchPlayersHybrid('player', onUpdate);
    await jest.advanceTimersByTimeAsync(400);

    const lastCallArgs = onUpdate.mock.calls[onUpdate.mock.calls.length - 1][0];
    expect(lastCallArgs.length).toBeLessThanOrEqual(10);
  });
});
