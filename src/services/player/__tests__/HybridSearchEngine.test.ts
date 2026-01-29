/**
 * Tests for hybrid player search engine.
 *
 * Validates waterfall strategy:
 * 1. Local SQLite player_search_cache (instant, ~4,900 Elite Index)
 * 2. Debounced Supabase Oracle (300ms) if < 3 local results
 * 3. Automatic caching of Oracle results
 */

import {
  searchPlayersHybrid,
  _resetForTesting,
} from '../HybridSearchEngine';
import * as WikidataService from '../../oracle/WikidataService';
import * as database from '@/lib/database';

jest.mock('../../oracle/WikidataService');
jest.mock('@/lib/database', () => ({
  searchPlayerCache: jest.fn().mockResolvedValue([]),
  getDatabase: jest.fn(() => ({
    runAsync: jest.fn().mockResolvedValue(undefined),
  })),
}));

const mockSearchPlayerCache = database.searchPlayerCache as jest.MockedFunction<
  typeof database.searchPlayerCache
>;

function makeLocalPlayer(overrides: Partial<database.CachedPlayer> = {}): database.CachedPlayer {
  return {
    id: 'Q1',
    name: 'Test Player',
    scout_rank: 100,
    birth_year: 1990,
    position_category: 'Forward',
    nationality_code: 'FR',
    ...overrides,
  };
}

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

  it('returns local results immediately with metadata', async () => {
    mockSearchPlayerCache.mockResolvedValue([
      makeLocalPlayer({
        id: 'Q11571',
        name: 'Cristiano Ronaldo',
        scout_rank: 207,
        birth_year: 1985,
        position_category: 'Forward',
        nationality_code: 'PRT',
      }),
    ]);

    const onUpdate = jest.fn();
    await searchPlayersHybrid('ronaldo', onUpdate);

    expect(onUpdate).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'Q11571',
          name: 'Cristiano Ronaldo',
          birth_year: 1985,
          position_category: 'Forward',
          nationality_code: 'PRT',
          source: 'local',
        }),
      ])
    );
  });

  it('skips Oracle if local results >= 3', async () => {
    const mockLocal = Array(3)
      .fill(null)
      .map((_, i) =>
        makeLocalPlayer({
          id: `Q${i}`,
          name: `Player ${i}`,
          scout_rank: 100 - i,
        })
      );
    mockSearchPlayerCache.mockResolvedValue(mockLocal);

    const onUpdate = jest.fn();
    await searchPlayersHybrid('player', onUpdate);

    // Advance past debounce
    jest.advanceTimersByTime(400);

    expect(WikidataService.searchPlayersOracle).not.toHaveBeenCalled();
  });

  it('calls Oracle after debounce if local results < 3', async () => {
    mockSearchPlayerCache.mockResolvedValue([]);
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
    mockSearchPlayerCache.mockResolvedValue([
      makeLocalPlayer({
        id: 'local-1',
        name: 'Cristiano Ronaldo',
        nationality_code: 'PRT',
      }),
    ]);
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
    mockSearchPlayerCache.mockResolvedValue([]);
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

  it('limits merged results to 10', async () => {
    // 2 local results (< 3, so Oracle fires)
    const mockLocal = Array(2)
      .fill(null)
      .map((_, i) =>
        makeLocalPlayer({
          id: `local-${i}`,
          name: `Local Player ${i}`,
          scout_rank: 50,
        })
      );

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

    mockSearchPlayerCache.mockResolvedValue(mockLocal);
    (WikidataService.searchPlayersOracle as jest.Mock).mockResolvedValue(mockOracle);

    const onUpdate = jest.fn();
    await searchPlayersHybrid('player', onUpdate);
    await jest.advanceTimersByTimeAsync(400);

    const lastCallArgs = onUpdate.mock.calls[onUpdate.mock.calls.length - 1][0];
    expect(lastCallArgs.length).toBeLessThanOrEqual(10);
  });

  it('prioritizes prefix matches via relevance scoring', async () => {
    mockSearchPlayerCache.mockResolvedValue([
      makeLocalPlayer({
        id: 'Q1',
        name: 'Cristiano Ronaldo',
        scout_rank: 207,
      }),
      makeLocalPlayer({
        id: 'Q2',
        name: 'Ronald Koeman',
        scout_rank: 50,
      }),
    ]);

    const onUpdate = jest.fn();
    await searchPlayersHybrid('ron', onUpdate);

    const results = onUpdate.mock.calls[0][0];
    // Both should have reasonable relevance scores
    expect(results.length).toBe(2);
    expect(results[0].relevance_score).toBeGreaterThan(0);
    expect(results[1].relevance_score).toBeGreaterThan(0);
  });

  it('prioritizes surname prefix over first name prefix', async () => {
    mockSearchPlayerCache.mockResolvedValue([
      makeLocalPlayer({
        id: 'Q1',
        name: 'Roberto Firmino',
        scout_rank: 69,
      }),
      makeLocalPlayer({
        id: 'Q2',
        name: 'Andrew Robertson',
        scout_rank: 53,
      }),
    ]);

    const onUpdate = jest.fn();
    await searchPlayersHybrid('rober', onUpdate);

    const results = onUpdate.mock.calls[0][0];
    // Robertson should rank first — "robertson" is a surname prefix match (0.95)
    // Firmino should rank second — "roberto" is a first name prefix match (0.85)
    expect(results[0].name).toBe('Andrew Robertson');
    expect(results[1].name).toBe('Roberto Firmino');
  });
});
