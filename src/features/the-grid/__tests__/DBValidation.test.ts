/**
 * Database Validation Tests for The Grid
 *
 * Tests for validating player guesses against the local SQLite database
 * instead of pre-defined valid_answers arrays.
 */

import { validateCellWithDB, DBValidationResult } from '../utils/validation';
import { TheGridContent, CellIndex } from '../types/theGrid.types';
import * as playerSearch from '@/services/player/playerSearch';

// Mock the player search module
jest.mock('@/services/player/playerSearch');

const mockDidPlayerPlayFor = playerSearch.didPlayerPlayFor as jest.MockedFunction<
  typeof playerSearch.didPlayerPlayFor
>;
const mockHasNationality = playerSearch.hasNationality as jest.MockedFunction<
  typeof playerSearch.hasNationality
>;
const mockGetPlayerById = playerSearch.getPlayerById as jest.MockedFunction<
  typeof playerSearch.getPlayerById
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
      // Cell 0: Real Madrid (col) + Brazil (row)
      // Player is Brazilian but didn't play for Real Madrid
      mockHasNationality.mockResolvedValue(true); // Brazilian
      mockDidPlayerPlayFor.mockResolvedValue(false); // Not Real Madrid

      const result = await validateCellWithDB('player-1', 0 as CellIndex, mockContent);

      expect(result.isValid).toBe(false);
      expect(result.matchedCriteria?.row).toBe(true);
      expect(result.matchedCriteria?.col).toBe(false);
    });

    it('returns invalid when player matches only column (club) but not row (nation)', async () => {
      // Cell 0: Real Madrid (col) + Brazil (row)
      // Player plays for Real Madrid but is not Brazilian
      mockDidPlayerPlayFor.mockResolvedValue(true); // Real Madrid
      mockHasNationality.mockResolvedValue(false); // Not Brazilian

      const result = await validateCellWithDB('player-1', 0 as CellIndex, mockContent);

      expect(result.isValid).toBe(false);
      expect(result.matchedCriteria?.row).toBe(false);
      expect(result.matchedCriteria?.col).toBe(true);
    });

    it('returns invalid when player matches first club but not second club', async () => {
      // Cell 3: Real Madrid (col) + Manchester United (row)
      // Player plays for Real Madrid but not Manchester United
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

      // Col 0 = Real Madrid (club), Row 0 = Brazil (nation)
      expect(mockDidPlayerPlayFor).toHaveBeenCalledWith('player-1', 'Real Madrid');
      expect(mockHasNationality).toHaveBeenCalledWith('player-1', 'BR');
    });

    it('correctly maps cell 4 to row 1, col 1', async () => {
      // Cell 4: Barcelona (col) + Manchester United (row) - both clubs
      mockDidPlayerPlayFor.mockResolvedValue(true);

      await validateCellWithDB('player-1', 4 as CellIndex, mockContent);

      expect(mockDidPlayerPlayFor).toHaveBeenCalledWith('player-1', 'Barcelona');
      expect(mockDidPlayerPlayFor).toHaveBeenCalledWith('player-1', 'Manchester United');
    });

    it('correctly maps cell 8 to row 2, col 2', async () => {
      // Cell 8: France (col) + Argentina (row) - both nations
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

      // Cell 2 has France as column
      await validateCellWithDB('player-1', 2 as CellIndex, mockContent);

      expect(mockHasNationality).toHaveBeenCalledWith('player-1', 'FR');
    });

    it('maps "Argentina" to "AR"', async () => {
      mockHasNationality.mockResolvedValue(true);

      // Cell 6 has Argentina as row
      await validateCellWithDB('player-1', 6 as CellIndex, mockContent);

      expect(mockHasNationality).toHaveBeenCalledWith('player-1', 'AR');
    });
  });
});

describe('validateCellWithDB edge cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPlayerById.mockResolvedValue(mockPlayer);
  });

  it('handles stat category type by returning false (not yet supported)', async () => {
    const contentWithStat: TheGridContent = {
      xAxis: [
        { type: 'stat', value: '100+ Goals' },
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

    mockHasNationality.mockResolvedValue(true);

    // Cell 0 has stat column - should fail column validation
    const result = await validateCellWithDB('player-1', 0 as CellIndex, contentWithStat);

    expect(result.isValid).toBe(false);
    expect(result.matchedCriteria?.col).toBe(false);
    expect(result.matchedCriteria?.row).toBe(true);
  });

  it('handles trophy category type by returning false (not yet supported)', async () => {
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

    mockHasNationality.mockResolvedValue(true);

    // Cell 0 has trophy column - should fail column validation
    const result = await validateCellWithDB('player-1', 0 as CellIndex, contentWithTrophy);

    expect(result.isValid).toBe(false);
    expect(result.matchedCriteria?.col).toBe(false);
    expect(result.matchedCriteria?.row).toBe(true);
  });
});
