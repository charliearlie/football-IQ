/**
 * Tests for ClubSearchEngine.
 *
 * Validates:
 * 1. Local SQLite club_colors search (instant, ~200 elite clubs)
 * 2. Nickname matching via CLUB_NICKNAME_MAP
 * 3. Debounced Supabase fallback (300ms) if < 3 local results
 * 4. Diacritic normalization (München vs Munchen)
 * 5. Relevance scoring and deduplication
 */

import {
  searchClubsHybrid,
  _resetForTesting,
} from '../ClubSearchEngine';
import * as database from '@/lib/database';
import { supabase } from '@/lib/supabase';
import type { CachedClub } from '../types';

jest.mock('@/lib/database', () => ({
  searchClubColors: jest.fn().mockResolvedValue([]),
  getClubColorById: jest.fn().mockResolvedValue(null),
}));

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        ilike: jest.fn(() => ({
          limit: jest.fn().mockResolvedValue({ data: [], error: null }),
        })),
      })),
    })),
  },
}));

const mockSearchClubColors = database.searchClubColors as jest.MockedFunction<
  typeof database.searchClubColors
>;
const mockGetClubColorById = database.getClubColorById as jest.MockedFunction<
  typeof database.getClubColorById
>;

function makeClub(overrides: Partial<CachedClub> = {}): CachedClub {
  return {
    id: 'Q9617',
    name: 'Arsenal F.C.',
    primary_color: '#EF0107',
    secondary_color: '#FFFFFF',
    ...overrides,
  };
}

describe('searchClubsHybrid', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    _resetForTesting();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('query validation', () => {
    it('returns empty for queries shorter than 2 characters', async () => {
      const onUpdate = jest.fn();
      await searchClubsHybrid('a', onUpdate);
      expect(onUpdate).toHaveBeenCalledWith([]);
      expect(mockSearchClubColors).not.toHaveBeenCalled();
    });

    it('returns empty for empty query', async () => {
      const onUpdate = jest.fn();
      await searchClubsHybrid('', onUpdate);
      expect(onUpdate).toHaveBeenCalledWith([]);
    });
  });

  describe('name matching', () => {
    it('"United" returns Manchester United, Newcastle United', async () => {
      mockSearchClubColors.mockResolvedValue([
        makeClub({ id: 'Q18602', name: 'Manchester United F.C.' }),
        makeClub({ id: 'Q18735', name: 'Newcastle United F.C.' }),
        makeClub({ id: 'Q19578', name: 'Sheffield United F.C.' }),
      ]);

      const onUpdate = jest.fn();
      await searchClubsHybrid('United', onUpdate);

      const results = onUpdate.mock.calls[0][0];
      expect(results.length).toBeGreaterThanOrEqual(2);
      expect(results.some((c: { name: string }) => c.name.includes('Manchester United'))).toBe(true);
      expect(results.some((c: { name: string }) => c.name.includes('Newcastle United'))).toBe(true);
    });

    it('"Bayern" returns Bayern Munich', async () => {
      mockSearchClubColors.mockResolvedValue([
        makeClub({ id: 'Q15789', name: 'FC Bayern Munich' }),
      ]);

      const onUpdate = jest.fn();
      await searchClubsHybrid('Bayern', onUpdate);

      const results = onUpdate.mock.calls[0][0];
      expect(results[0].name).toBe('FC Bayern Munich');
      expect(results[0].match_type).toBe('name');
    });

    it('is case insensitive', async () => {
      mockSearchClubColors.mockResolvedValue([
        makeClub({ id: 'Q9617', name: 'Arsenal F.C.' }),
      ]);

      const onUpdate = jest.fn();
      await searchClubsHybrid('ARSENAL', onUpdate);

      const results = onUpdate.mock.calls[0][0];
      expect(results.length).toBe(1);
      expect(results[0].name).toBe('Arsenal F.C.');
    });
  });

  describe('nickname matching', () => {
    it('"Spurs" returns Tottenham Hotspur', async () => {
      // No direct name match
      mockSearchClubColors.mockResolvedValue([]);
      // Nickname lookup returns the club
      mockGetClubColorById.mockResolvedValue(
        makeClub({ id: 'Q18671', name: 'Tottenham Hotspur F.C.' })
      );

      const onUpdate = jest.fn();
      await searchClubsHybrid('Spurs', onUpdate);

      const results = onUpdate.mock.calls[0][0];
      expect(results.length).toBe(1);
      expect(results[0].name).toBe('Tottenham Hotspur F.C.');
      expect(results[0].match_type).toBe('nickname');
    });

    it('"Gunners" returns Arsenal', async () => {
      mockSearchClubColors.mockResolvedValue([]);
      mockGetClubColorById.mockResolvedValue(
        makeClub({ id: 'Q9617', name: 'Arsenal F.C.' })
      );

      const onUpdate = jest.fn();
      await searchClubsHybrid('Gunners', onUpdate);

      const results = onUpdate.mock.calls[0][0];
      expect(results[0].name).toBe('Arsenal F.C.');
      expect(results[0].match_type).toBe('nickname');
    });

    it('"Red Devils" returns Manchester United', async () => {
      mockSearchClubColors.mockResolvedValue([]);
      mockGetClubColorById.mockResolvedValue(
        makeClub({ id: 'Q18602', name: 'Manchester United F.C.' })
      );

      const onUpdate = jest.fn();
      await searchClubsHybrid('Red Devils', onUpdate);

      const results = onUpdate.mock.calls[0][0];
      expect(results[0].name).toBe('Manchester United F.C.');
      expect(results[0].match_type).toBe('nickname');
    });

    it('"Barca" returns FC Barcelona', async () => {
      mockSearchClubColors.mockResolvedValue([]);
      mockGetClubColorById.mockResolvedValue(
        makeClub({ id: 'Q7156', name: 'FC Barcelona' })
      );

      const onUpdate = jest.fn();
      await searchClubsHybrid('Barca', onUpdate);

      const results = onUpdate.mock.calls[0][0];
      expect(results[0].name).toBe('FC Barcelona');
      expect(results[0].match_type).toBe('nickname');
    });
  });

  describe('diacritic handling', () => {
    it('handles diacritics: "Munchen" matches "FC Bayern München"', async () => {
      mockSearchClubColors.mockResolvedValue([
        makeClub({ id: 'Q15789', name: 'FC Bayern München' }),
      ]);

      const onUpdate = jest.fn();
      await searchClubsHybrid('Munchen', onUpdate);

      const results = onUpdate.mock.calls[0][0];
      expect(results.length).toBe(1);
      expect(results[0].name).toBe('FC Bayern München');
    });

    it('handles diacritics: "München" matches "FC Bayern München"', async () => {
      mockSearchClubColors.mockResolvedValue([
        makeClub({ id: 'Q15789', name: 'FC Bayern München' }),
      ]);

      const onUpdate = jest.fn();
      await searchClubsHybrid('München', onUpdate);

      const results = onUpdate.mock.calls[0][0];
      expect(results.length).toBe(1);
      expect(results[0].name).toBe('FC Bayern München');
    });

    it('handles Scandinavian characters', async () => {
      mockSearchClubColors.mockResolvedValue([
        makeClub({ id: 'Q11974', name: 'Borussia Mönchengladbach' }),
      ]);

      const onUpdate = jest.fn();
      await searchClubsHybrid('Monchengladbach', onUpdate);

      const results = onUpdate.mock.calls[0][0];
      expect(results.length).toBe(1);
    });
  });

  describe('remote fallback', () => {
    it('skips Supabase if local results >= 3', async () => {
      const mockLocal = Array(3)
        .fill(null)
        .map((_, i) =>
          makeClub({
            id: `Q${i}`,
            name: `Club ${i} FC`,
          })
        );
      mockSearchClubColors.mockResolvedValue(mockLocal);

      const onUpdate = jest.fn();
      await searchClubsHybrid('Club', onUpdate);

      // Advance past debounce
      await jest.advanceTimersByTimeAsync(400);

      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('calls Supabase after debounce if local results < 3', async () => {
      mockSearchClubColors.mockResolvedValue([
        makeClub({ id: 'Q1', name: 'Local Club FC' }),
      ]);

      const mockSupabaseResult = {
        data: [
          { id: 'Q2', name: 'Remote Club FC', primary_color: '#000', secondary_color: '#FFF' },
        ],
        error: null,
      };

      const mockLimit = jest.fn().mockResolvedValue(mockSupabaseResult);
      const mockIlike = jest.fn(() => ({ limit: mockLimit }));
      const mockSelect = jest.fn(() => ({ ilike: mockIlike }));
      (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

      const onUpdate = jest.fn();
      await searchClubsHybrid('Club', onUpdate);

      // First call should be local results
      expect(onUpdate.mock.calls[0][0].length).toBe(1);

      // Advance past debounce
      await jest.advanceTimersByTimeAsync(400);

      expect(supabase.from).toHaveBeenCalledWith('clubs');
    });

    it('handles Supabase errors gracefully', async () => {
      mockSearchClubColors.mockResolvedValue([]);

      const mockLimit = jest.fn().mockResolvedValue({ data: null, error: { message: 'Network error' } });
      const mockIlike = jest.fn(() => ({ limit: mockLimit }));
      const mockSelect = jest.fn(() => ({ ilike: mockIlike }));
      (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

      const onUpdate = jest.fn();
      await searchClubsHybrid('random', onUpdate);
      await jest.advanceTimersByTimeAsync(400);

      // Should not throw — returns local results (empty)
      expect(onUpdate).toHaveBeenCalledWith([]);
    });
  });

  describe('deduplication and scoring', () => {
    it('deduplicates results by club ID', async () => {
      // Same club returned from both name search and nickname lookup
      mockSearchClubColors.mockResolvedValue([
        makeClub({ id: 'Q18602', name: 'Manchester United F.C.' }),
      ]);
      mockGetClubColorById.mockResolvedValue(
        makeClub({ id: 'Q18602', name: 'Manchester United F.C.' })
      );

      const onUpdate = jest.fn();
      await searchClubsHybrid('United', onUpdate);

      const results = onUpdate.mock.calls[0][0];
      const unitedCount = results.filter(
        (c: { id: string }) => c.id === 'Q18602'
      ).length;
      expect(unitedCount).toBe(1);
    });

    it('prioritizes prefix matches over contains', async () => {
      mockSearchClubColors.mockResolvedValue([
        makeClub({ id: 'Q1', name: 'Athletic Club Bilbao' }), // Contains "ath"
        makeClub({ id: 'Q2', name: 'Atalanta BC' }), // Starts with "ata" (close to "ath")
      ]);

      const onUpdate = jest.fn();
      await searchClubsHybrid('ath', onUpdate);

      const results = onUpdate.mock.calls[0][0];
      // Athletic should rank higher (prefix match)
      expect(results[0].name).toBe('Athletic Club Bilbao');
    });

    it('limits results to 8', async () => {
      const mockLocal = Array(10)
        .fill(null)
        .map((_, i) =>
          makeClub({
            id: `Q${i}`,
            name: `Club ${i} FC`,
          })
        );
      mockSearchClubColors.mockResolvedValue(mockLocal);

      const onUpdate = jest.fn();
      await searchClubsHybrid('Club', onUpdate);

      const results = onUpdate.mock.calls[0][0];
      expect(results.length).toBeLessThanOrEqual(8);
    });
  });

  describe('result format', () => {
    it('includes source and match_type in results', async () => {
      mockSearchClubColors.mockResolvedValue([
        makeClub({ id: 'Q9617', name: 'Arsenal F.C.' }),
      ]);

      const onUpdate = jest.fn();
      await searchClubsHybrid('Arsenal', onUpdate);

      const results = onUpdate.mock.calls[0][0];
      expect(results[0]).toMatchObject({
        id: 'Q9617',
        name: 'Arsenal F.C.',
        primary_color: '#EF0107',
        secondary_color: '#FFFFFF',
        source: 'local',
        match_type: 'name',
        relevance_score: expect.any(Number),
      });
    });

    it('includes color data for UI rendering', async () => {
      mockSearchClubColors.mockResolvedValue([
        makeClub({
          id: 'Q1130849',
          name: 'Liverpool F.C.',
          primary_color: '#C8102E',
          secondary_color: '#F6EB61',
        }),
      ]);

      const onUpdate = jest.fn();
      await searchClubsHybrid('Liverpool', onUpdate);

      const results = onUpdate.mock.calls[0][0];
      expect(results[0].primary_color).toBe('#C8102E');
      expect(results[0].secondary_color).toBe('#F6EB61');
    });
  });
});
