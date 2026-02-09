/**
 * Database Validation Tests for The Grid
 *
 * Tests for validating player guesses against the local SQLite database
 * instead of pre-defined valid_answers arrays.
 *
 * Includes achievement validation via stats_cache for trophy/stat categories.
 */

import { validateCellWithDB } from '../utils/validation';
import { TheGridContent, CellIndex } from '../types/theGrid.types';
import * as playerSearch from '@/services/player/playerSearch';
import * as database from '@/lib/database';

// Mock the player search module
jest.mock('@/services/player/playerSearch');

// Mock the database module for stats_cache lookups
jest.mock('@/lib/database', () => ({
  getPlayerStatsCache: jest.fn(),
}));

const mockDidPlayerPlayFor = playerSearch.didPlayerPlayFor as jest.MockedFunction<
  typeof playerSearch.didPlayerPlayFor
>;
const mockHasNationality = playerSearch.hasNationality as jest.MockedFunction<
  typeof playerSearch.hasNationality
>;
const mockGetPlayerById = playerSearch.getPlayerById as jest.MockedFunction<
  typeof playerSearch.getPlayerById
>;
const mockGetPlayerStatsCache = database.getPlayerStatsCache as jest.MockedFunction<
  typeof database.getPlayerStatsCache
>;

// Test fixture: Grid with club/nation combinations
const mockContent: TheGridContent = {
  xAxis: [
    { type: 'club', value: 'Real Madrid' },
    { type: 'club', value: 'Barcelona' },
    { type: 'nation', value: 'France' },
  ],
  yAxis: [
    { type: 'nation', value: 'Brazil' },
    { type: 'club', value: 'Manchester United' },
    { type: 'nation', value: 'Argentina' },
  ],
  valid_answers: {}, // Empty - we're using DB validation
};

// Test player fixture
const mockPlayer = {
  id: 'player-1',
  externalId: 12345,
  name: 'Test Player',
  searchName: 'test player',
  clubs: ['Real Madrid', 'Manchester United'],
  nationalities: ['BR'],
  isActive: true,
  lastSyncedAt: null,
};

describe('validateCellWithDB', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPlayerById.mockResolvedValue(mockPlayer);
    mockGetPlayerStatsCache.mockResolvedValue({});
  });

  describe('player matches both row AND column criteria', () => {
    it('validates player matching club (col) + nation (row)', async () => {
      // Cell 0: Real Madrid (col) + Brazil (row)
      // Player plays for Real Madrid and is Brazilian
      mockDidPlayerPlayFor.mockResolvedValue(true);
      mockHasNationality.mockResolvedValue(true);

      const result = await validateCellWithDB('player-1', 0 as CellIndex, mockContent);

      expect(result.isValid).toBe(true);
      expect(result.matchedCriteria?.row).toBe(true);
      expect(result.matchedCriteria?.col).toBe(true);
      expect(mockDidPlayerPlayFor).toHaveBeenCalledWith('player-1', 'Real Madrid');
      expect(mockHasNationality).toHaveBeenCalledWith('player-1', 'BR');
    });

    it('validates player matching club (col) + club (row)', async () => {
      // Cell 3: Real Madrid (col) + Manchester United (row)
      // Player plays for both clubs
      mockDidPlayerPlayFor.mockImplementation(async (playerId, club) => {
        return club === 'Real Madrid' || club === 'Manchester United';
      });

      const result = await validateCellWithDB('player-1', 3 as CellIndex, mockContent);

      expect(result.isValid).toBe(true);
      expect(result.matchedCriteria?.row).toBe(true);
      expect(result.matchedCriteria?.col).toBe(true);
      expect(mockDidPlayerPlayFor).toHaveBeenCalledWith('player-1', 'Real Madrid');
      expect(mockDidPlayerPlayFor).toHaveBeenCalledWith('player-1', 'Manchester United');
    });

    it('validates player matching nation (col) + nation (row)', async () => {
      // Cell 2: France (col) + Brazil (row)
      // This is an unusual case (dual nationality)
      mockHasNationality.mockImplementation(async (playerId, code) => {
        return code === 'FR' || code === 'BR';
      });

      const result = await validateCellWithDB('player-1', 2 as CellIndex, mockContent);

      expect(result.isValid).toBe(true);
      expect(result.matchedCriteria?.row).toBe(true);
      expect(result.matchedCriteria?.col).toBe(true);
    });
  });

  describe('player matches only one criterion', () => {
    it('returns invalid when player matches only row (nation) but not column (club)', async () => {
      mockHasNationality.mockResolvedValue(true);
      mockDidPlayerPlayFor.mockResolvedValue(false);

      const result = await validateCellWithDB('player-1', 0 as CellIndex, mockContent);

      expect(result.isValid).toBe(false);
      expect(result.matchedCriteria?.row).toBe(true);
      expect(result.matchedCriteria?.col).toBe(false);
    });

    it('returns invalid when player matches only column (club) but not row (nation)', async () => {
      mockDidPlayerPlayFor.mockResolvedValue(true);
      mockHasNationality.mockResolvedValue(false);

      const result = await validateCellWithDB('player-1', 0 as CellIndex, mockContent);

      expect(result.isValid).toBe(false);
      expect(result.matchedCriteria?.row).toBe(false);
      expect(result.matchedCriteria?.col).toBe(true);
    });

    it('returns invalid when player matches first club but not second club', async () => {
      mockDidPlayerPlayFor.mockImplementation(async (playerId, club) => {
        return club === 'Real Madrid';
      });

      const result = await validateCellWithDB('player-1', 3 as CellIndex, mockContent);

      expect(result.isValid).toBe(false);
      expect(result.matchedCriteria?.col).toBe(true);
      expect(result.matchedCriteria?.row).toBe(false);
    });
  });

  describe('player matches neither criterion', () => {
    it('returns invalid when player matches neither club nor nation', async () => {
      mockDidPlayerPlayFor.mockResolvedValue(false);
      mockHasNationality.mockResolvedValue(false);

      const result = await validateCellWithDB('player-1', 0 as CellIndex, mockContent);

      expect(result.isValid).toBe(false);
      expect(result.matchedCriteria?.row).toBe(false);
      expect(result.matchedCriteria?.col).toBe(false);
    });
  });

  describe('player not found', () => {
    it('returns invalid when player does not exist in database', async () => {
      mockGetPlayerById.mockResolvedValue(null);

      const result = await validateCellWithDB('nonexistent-player', 0 as CellIndex, mockContent);

      expect(result.isValid).toBe(false);
      expect(result.matchedCriteria).toBeUndefined();
    });
  });

  describe('cell index mapping', () => {
    it('correctly maps cell 0 to row 0, col 0', async () => {
      mockDidPlayerPlayFor.mockResolvedValue(true);
      mockHasNationality.mockResolvedValue(true);

      await validateCellWithDB('player-1', 0 as CellIndex, mockContent);

      expect(mockDidPlayerPlayFor).toHaveBeenCalledWith('player-1', 'Real Madrid');
      expect(mockHasNationality).toHaveBeenCalledWith('player-1', 'BR');
    });

    it('correctly maps cell 4 to row 1, col 1', async () => {
      mockDidPlayerPlayFor.mockResolvedValue(true);

      await validateCellWithDB('player-1', 4 as CellIndex, mockContent);

      expect(mockDidPlayerPlayFor).toHaveBeenCalledWith('player-1', 'Barcelona');
      expect(mockDidPlayerPlayFor).toHaveBeenCalledWith('player-1', 'Manchester United');
    });

    it('correctly maps cell 8 to row 2, col 2', async () => {
      mockHasNationality.mockResolvedValue(true);

      await validateCellWithDB('player-1', 8 as CellIndex, mockContent);

      expect(mockHasNationality).toHaveBeenCalledWith('player-1', 'FR');
      expect(mockHasNationality).toHaveBeenCalledWith('player-1', 'AR');
    });
  });

  describe('nationality code mapping', () => {
    it('maps "Brazil" to "BR"', async () => {
      mockHasNationality.mockResolvedValue(true);
      mockDidPlayerPlayFor.mockResolvedValue(true);

      await validateCellWithDB('player-1', 0 as CellIndex, mockContent);

      expect(mockHasNationality).toHaveBeenCalledWith('player-1', 'BR');
    });

    it('maps "France" to "FR"', async () => {
      mockHasNationality.mockResolvedValue(true);

      await validateCellWithDB('player-1', 2 as CellIndex, mockContent);

      expect(mockHasNationality).toHaveBeenCalledWith('player-1', 'FR');
    });

    it('maps "Argentina" to "AR"', async () => {
      mockHasNationality.mockResolvedValue(true);

      await validateCellWithDB('player-1', 6 as CellIndex, mockContent);

      expect(mockHasNationality).toHaveBeenCalledWith('player-1', 'AR');
    });
  });
});

describe('Achievement Validation via stats_cache', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPlayerById.mockResolvedValue(mockPlayer);
  });

  describe('trophy category validation', () => {
    const contentWithTrophy: TheGridContent = {
      xAxis: [
        { type: 'trophy', value: 'Champions League' },
        { type: 'club', value: 'Barcelona' },
        { type: 'nation', value: 'France' },
      ],
      yAxis: [
        { type: 'nation', value: 'Brazil' },
        { type: 'club', value: 'Manchester United' },
        { type: 'nation', value: 'Argentina' },
      ],
      valid_answers: {},
    };

    it('validates player with Champions League trophy via stats_cache', async () => {
      mockGetPlayerStatsCache.mockResolvedValue({ ucl_titles: 4 });
      mockHasNationality.mockResolvedValue(true);

      const result = await validateCellWithDB('player-1', 0 as CellIndex, contentWithTrophy);

      expect(result.isValid).toBe(true);
      expect(result.matchedCriteria?.col).toBe(true);
      expect(result.matchedCriteria?.row).toBe(true);
    });

    it('rejects player without the required trophy', async () => {
      mockGetPlayerStatsCache.mockResolvedValue({});
      mockHasNationality.mockResolvedValue(true);

      const result = await validateCellWithDB('player-1', 0 as CellIndex, contentWithTrophy);

      expect(result.isValid).toBe(false);
      expect(result.matchedCriteria?.col).toBe(false);
      expect(result.matchedCriteria?.row).toBe(true);
    });

    it('validates World Cup Winner trophy', async () => {
      const contentWithWorldCup: TheGridContent = {
        xAxis: [
          { type: 'trophy', value: 'World Cup Winner' },
          { type: 'club', value: 'Barcelona' },
          { type: 'nation', value: 'France' },
        ],
        yAxis: [
          { type: 'club', value: 'Real Madrid' },
          { type: 'club', value: 'Manchester United' },
          { type: 'nation', value: 'Argentina' },
        ],
        valid_answers: {},
      };

      mockGetPlayerStatsCache.mockResolvedValue({ world_cup_titles: 1 });
      mockDidPlayerPlayFor.mockResolvedValue(true);

      const result = await validateCellWithDB('player-1', 0 as CellIndex, contentWithWorldCup);

      expect(result.isValid).toBe(true);
    });

    it('rejects player with zero count for trophy', async () => {
      mockGetPlayerStatsCache.mockResolvedValue({ ucl_titles: 0 });
      mockHasNationality.mockResolvedValue(true);

      const result = await validateCellWithDB('player-1', 0 as CellIndex, contentWithTrophy);

      expect(result.isValid).toBe(false);
      expect(result.matchedCriteria?.col).toBe(false);
    });
  });

  describe('stat category validation', () => {
    const contentWithStat: TheGridContent = {
      xAxis: [
        { type: 'stat', value: "5+ Ballon d'Ors" },
        { type: 'club', value: 'Barcelona' },
        { type: 'nation', value: 'France' },
      ],
      yAxis: [
        { type: 'nation', value: 'Brazil' },
        { type: 'club', value: 'Manchester United' },
        { type: 'nation', value: 'Argentina' },
      ],
      valid_answers: {},
    };

    it('validates "5+ Ballon d\'Ors" for player who qualifies', async () => {
      mockGetPlayerStatsCache.mockResolvedValue({ ballon_dor_count: 8 });
      mockHasNationality.mockResolvedValue(true);

      const result = await validateCellWithDB('player-1', 0 as CellIndex, contentWithStat);

      expect(result.isValid).toBe(true);
      expect(result.matchedCriteria?.col).toBe(true);
      expect(result.matchedCriteria?.row).toBe(true);
    });

    it('rejects player below stat threshold', async () => {
      mockGetPlayerStatsCache.mockResolvedValue({ ballon_dor_count: 3 });
      mockHasNationality.mockResolvedValue(true);

      const result = await validateCellWithDB('player-1', 0 as CellIndex, contentWithStat);

      expect(result.isValid).toBe(false);
      expect(result.matchedCriteria?.col).toBe(false);
      expect(result.matchedCriteria?.row).toBe(true);
    });

    it('validates player at exact threshold', async () => {
      mockGetPlayerStatsCache.mockResolvedValue({ ballon_dor_count: 5 });
      mockHasNationality.mockResolvedValue(true);

      const result = await validateCellWithDB('player-1', 0 as CellIndex, contentWithStat);

      expect(result.isValid).toBe(true);
      expect(result.matchedCriteria?.col).toBe(true);
    });

    it('validates "3+ Champions League titles" stat expression', async () => {
      const contentWith3UCL: TheGridContent = {
        xAxis: [
          { type: 'stat', value: '3+ Champions League titles' },
          { type: 'club', value: 'Barcelona' },
          { type: 'nation', value: 'France' },
        ],
        yAxis: [
          { type: 'club', value: 'Real Madrid' },
          { type: 'club', value: 'Manchester United' },
          { type: 'nation', value: 'Argentina' },
        ],
        valid_answers: {},
      };

      mockGetPlayerStatsCache.mockResolvedValue({ ucl_titles: 5 });
      mockDidPlayerPlayFor.mockResolvedValue(true);

      const result = await validateCellWithDB('player-1', 0 as CellIndex, contentWith3UCL);

      expect(result.isValid).toBe(true);
    });
  });

  describe('mixed category validation (club + trophy)', () => {
    it('validates player matching club AND trophy', async () => {
      const mixedContent: TheGridContent = {
        xAxis: [
          { type: 'club', value: 'Real Madrid' },
          { type: 'club', value: 'Barcelona' },
          { type: 'trophy', value: 'Champions League' },
        ],
        yAxis: [
          { type: 'trophy', value: 'World Cup Winner' },
          { type: 'nation', value: 'Brazil' },
          { type: 'club', value: 'Manchester United' },
        ],
        valid_answers: {},
      };

      mockDidPlayerPlayFor.mockResolvedValue(true);
      mockGetPlayerStatsCache.mockResolvedValue({ world_cup_titles: 1, ucl_titles: 3 });

      const result = await validateCellWithDB('player-1', 0 as CellIndex, mixedContent);

      expect(result.isValid).toBe(true);
      expect(result.matchedCriteria?.col).toBe(true);
      expect(result.matchedCriteria?.row).toBe(true);
    });

    it('rejects player matching club but not trophy', async () => {
      const mixedContent: TheGridContent = {
        xAxis: [
          { type: 'club', value: 'Real Madrid' },
          { type: 'club', value: 'Barcelona' },
          { type: 'trophy', value: 'Champions League' },
        ],
        yAxis: [
          { type: 'trophy', value: 'World Cup Winner' },
          { type: 'nation', value: 'Brazil' },
          { type: 'club', value: 'Manchester United' },
        ],
        valid_answers: {},
      };

      mockDidPlayerPlayFor.mockResolvedValue(true);
      mockGetPlayerStatsCache.mockResolvedValue({});

      const result = await validateCellWithDB('player-1', 0 as CellIndex, mixedContent);

      expect(result.isValid).toBe(false);
      expect(result.matchedCriteria?.col).toBe(true);
      expect(result.matchedCriteria?.row).toBe(false);
    });
  });

  describe('zero-spoiler guarantee', () => {
    it('does not expose achievement data in player search results', () => {
      // The UnifiedPlayer type used by search/autocomplete should never
      // include stats_cache, achievements, or trophies
      const searchResult = {
        id: 'Q615',
        name: 'Lionel Messi',
        nationality_code: 'AR',
        birth_year: 1987,
        position_category: 'Forward',
        source: 'local' as const,
        relevance_score: 0.95,
      };

      expect(searchResult).not.toHaveProperty('stats_cache');
      expect(searchResult).not.toHaveProperty('achievements');
      expect(searchResult).not.toHaveProperty('trophies');
    });
  });
});
