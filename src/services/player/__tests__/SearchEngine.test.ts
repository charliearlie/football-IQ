/**
 * TDD tests for Player Search Engine.
 * Tests are written BEFORE implementation.
 */
import * as SQLite from 'expo-sqlite';
import {
  normalizeSearchName,
  levenshteinDistance,
  countryCodeToEmoji,
} from '../playerUtils';
import {
  searchPlayers,
  getPlayerById,
  didPlayerPlayFor,
  hasNationality,
} from '../playerSearch';
import { initDatabase, closeDatabase } from '@/lib/database';

// Mock expo-sqlite
jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(),
}));

// ============ UTILITY FUNCTION TESTS ============

describe('normalizeSearchName', () => {
  it('converts to lowercase', () => {
    expect(normalizeSearchName('MESSI')).toBe('messi');
    expect(normalizeSearchName('Ronaldo')).toBe('ronaldo');
  });

  it('removes diacritics/accents', () => {
    expect(normalizeSearchName('Özil')).toBe('ozil');
    expect(normalizeSearchName('Ibrahimović')).toBe('ibrahimovic');
    expect(normalizeSearchName('Müller')).toBe('muller');
    expect(normalizeSearchName('Núñez')).toBe('nunez');
  });

  it('handles special Nordic characters', () => {
    expect(normalizeSearchName('Sørloth')).toBe('sorloth');
    expect(normalizeSearchName('Ødegaard')).toBe('odegaard');
    expect(normalizeSearchName('Håland')).toBe('haland');
  });

  it('handles other special characters', () => {
    expect(normalizeSearchName('Łukasz')).toBe('lukasz');
    expect(normalizeSearchName('Großkreutz')).toBe('grosskreutz');
  });

  it('trims whitespace', () => {
    expect(normalizeSearchName('  Ronaldo  ')).toBe('ronaldo');
    expect(normalizeSearchName('\tMessi\n')).toBe('messi');
  });

  it('handles compound names', () => {
    expect(normalizeSearchName('Son Heung-min')).toBe('son heung-min');
    expect(normalizeSearchName("N'Golo Kanté")).toBe("n'golo kante");
  });
});

describe('levenshteinDistance', () => {
  it('returns 0 for identical strings', () => {
    expect(levenshteinDistance('messi', 'messi')).toBe(0);
    expect(levenshteinDistance('', '')).toBe(0);
  });

  it('returns correct distance for single deletion', () => {
    expect(levenshteinDistance('messi', 'mesi')).toBe(1);
    expect(levenshteinDistance('ronaldo', 'ronalo')).toBe(1);
  });

  it('returns correct distance for single insertion', () => {
    expect(levenshteinDistance('messi', 'messis')).toBe(1);
    expect(levenshteinDistance('kane', 'kanes')).toBe(1);
  });

  it('returns correct distance for single substitution', () => {
    expect(levenshteinDistance('messi', 'massi')).toBe(1);
    expect(levenshteinDistance('messi', 'messo')).toBe(1);
  });

  it('handles empty strings', () => {
    expect(levenshteinDistance('', 'abc')).toBe(3);
    expect(levenshteinDistance('abc', '')).toBe(3);
  });

  it('calculates complex edits correctly', () => {
    expect(levenshteinDistance('kitten', 'sitting')).toBe(3);
    expect(levenshteinDistance('ibrahimovic', 'ibrahimovich')).toBe(1);
  });

  it('handles case sensitivity', () => {
    // levenshteinDistance is case-sensitive; normalization should happen before
    expect(levenshteinDistance('Messi', 'messi')).toBe(1);
  });
});

describe('countryCodeToEmoji', () => {
  it('converts BR to Brazil flag', () => {
    expect(countryCodeToEmoji('BR')).toBe('🇧🇷');
  });

  it('converts FR to France flag', () => {
    expect(countryCodeToEmoji('FR')).toBe('🇫🇷');
  });

  it('converts AR to Argentina flag', () => {
    expect(countryCodeToEmoji('AR')).toBe('🇦🇷');
  });

  it('converts SE to Sweden flag', () => {
    expect(countryCodeToEmoji('SE')).toBe('🇸🇪');
  });

  it('handles lowercase codes', () => {
    expect(countryCodeToEmoji('de')).toBe('🇩🇪');
    expect(countryCodeToEmoji('fr')).toBe('🇫🇷');
  });

  it('returns empty string for plain GB (Union Jack never shown)', () => {
    expect(countryCodeToEmoji('GB')).toBe('');
    expect(countryCodeToEmoji('gb')).toBe('');
  });

  it('converts GB subdivision codes to home nation flags', () => {
    // England, Scotland, Wales use black flag + tag sequences
    expect(countryCodeToEmoji('GB-ENG')).not.toBe('');
    expect(countryCodeToEmoji('GB-SCT')).not.toBe('');
    expect(countryCodeToEmoji('GB-WLS')).not.toBe('');
    expect(countryCodeToEmoji('GB-NIR')).not.toBe('');
    // Should not produce the GB flag
    expect(countryCodeToEmoji('GB-ENG')).not.toBe('🇬🇧');
  });

  it('returns empty string for invalid codes', () => {
    expect(countryCodeToEmoji('X')).toBe('');
    expect(countryCodeToEmoji('ABC')).toBe('');
    expect(countryCodeToEmoji('')).toBe('');
  });
});

// ============ SEARCH SERVICE TESTS ============

describe('searchPlayers', () => {
  let mockDb: {
    execAsync: jest.Mock;
    runAsync: jest.Mock;
    getFirstAsync: jest.Mock;
    getAllAsync: jest.Mock;
    closeAsync: jest.Mock;
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockDb = {
      execAsync: jest.fn().mockResolvedValue(undefined),
      runAsync: jest.fn().mockResolvedValue({ lastInsertRowId: 1, changes: 1 }),
      getFirstAsync: jest.fn().mockResolvedValue({ user_version: 4 }),
      getAllAsync: jest.fn().mockResolvedValue([]),
      closeAsync: jest.fn().mockResolvedValue(undefined),
    };

    (SQLite.openDatabaseAsync as jest.Mock).mockResolvedValue(mockDb);
    await initDatabase();
  });

  afterEach(async () => {
    await closeDatabase();
  });

  it('returns empty array for queries under 3 characters', async () => {
    mockDb.getAllAsync.mockClear();
    const results = await searchPlayers('ab');
    expect(results).toEqual([]);
    // Should not query database for short queries
    expect(mockDb.getAllAsync).not.toHaveBeenCalled();
  });

  it('returns empty array for empty query', async () => {
    const results = await searchPlayers('');
    expect(results).toEqual([]);
  });

  it('uses LIKE query with normalized search term', async () => {
    mockDb.getAllAsync.mockResolvedValueOnce([]);

    await searchPlayers('Messi');

    expect(mockDb.getAllAsync).toHaveBeenCalledWith(
      expect.stringContaining('LIKE'),
      expect.objectContaining({ $pattern: '%messi%' })
    );
  });

  it('parses JSON clubs array from result', async () => {
    mockDb.getAllAsync.mockResolvedValueOnce([
      {
        id: 'player-1',
        external_id: 12345,
        name: 'Lionel Messi',
        search_name: 'lionel messi',
        clubs: '["Barcelona", "PSG", "Inter Miami"]',
        nationalities: '["AR"]',
        is_active: 1,
        last_synced_at: null,
      },
    ]);

    const results = await searchPlayers('messi');

    expect(results.length).toBe(1);
    expect(results[0].player.clubs).toEqual(['Barcelona', 'PSG', 'Inter Miami']);
    expect(results[0].player.nationalities).toEqual(['AR']);
  });

  it('ranks results by relevance score', async () => {
    mockDb.getAllAsync.mockResolvedValueOnce([
      {
        id: '1',
        external_id: null,
        name: 'Sergio Messi',
        search_name: 'sergio messi',
        clubs: '[]',
        nationalities: '[]',
        is_active: 1,
        last_synced_at: null,
      },
      {
        id: '2',
        external_id: null,
        name: 'Lionel Messi',
        search_name: 'lionel messi',
        clubs: '[]',
        nationalities: '[]',
        is_active: 1,
        last_synced_at: null,
      },
    ]);

    const results = await searchPlayers('messi');

    // Both contain 'messi', should have relevance scores
    expect(results.length).toBe(2);
    expect(results[0].relevanceScore).toBeGreaterThan(0);
    expect(results[1].relevanceScore).toBeGreaterThan(0);
  });

  it('respects limit parameter', async () => {
    const manyPlayers = Array.from({ length: 20 }, (_, i) => ({
      id: `player-${i}`,
      external_id: null,
      name: `Player ${i}`,
      search_name: `player ${i}`,
      clubs: '[]',
      nationalities: '[]',
      is_active: 1,
      last_synced_at: null,
    }));
    mockDb.getAllAsync.mockResolvedValueOnce(manyPlayers);

    const results = await searchPlayers('player', 5);

    expect(results.length).toBeLessThanOrEqual(5);
  });

  it('finds "Ibra" when searching for Ibrahimović', async () => {
    mockDb.getAllAsync.mockResolvedValueOnce([
      {
        id: 'zlatan-1',
        external_id: 35,
        name: 'Zlatan Ibrahimović',
        search_name: 'zlatan ibrahimovic',
        clubs: '["Malmö FF", "Ajax", "Juventus", "Inter Milan", "Barcelona", "AC Milan", "PSG", "Manchester United", "LA Galaxy"]',
        nationalities: '["SE"]',
        is_active: 0,
        last_synced_at: '2024-01-01T00:00:00Z',
      },
    ]);

    const results = await searchPlayers('ibra');

    expect(results.length).toBe(1);
    expect(results[0].player.name).toBe('Zlatan Ibrahimović');
  });
});

describe('getPlayerById', () => {
  let mockDb: {
    execAsync: jest.Mock;
    runAsync: jest.Mock;
    getFirstAsync: jest.Mock;
    getAllAsync: jest.Mock;
    closeAsync: jest.Mock;
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockDb = {
      execAsync: jest.fn().mockResolvedValue(undefined),
      runAsync: jest.fn().mockResolvedValue({ lastInsertRowId: 1, changes: 1 }),
      getFirstAsync: jest.fn().mockResolvedValue({ user_version: 4 }),
      getAllAsync: jest.fn().mockResolvedValue([]),
      closeAsync: jest.fn().mockResolvedValue(undefined),
    };

    (SQLite.openDatabaseAsync as jest.Mock).mockResolvedValue(mockDb);
    await initDatabase();
  });

  afterEach(async () => {
    await closeDatabase();
  });

  it('returns null for non-existent player', async () => {
    // Reset the mock after initDatabase used it for migration check
    mockDb.getFirstAsync.mockResolvedValue(null);

    const player = await getPlayerById('non-existent-id');
    expect(player).toBeNull();
  });

  it('returns parsed player for existing ID', async () => {
    // Reset the mock after initDatabase used it for migration check
    mockDb.getFirstAsync.mockResolvedValue({
      id: 'player-1',
      external_id: 123,
      name: 'Test Player',
      search_name: 'test player',
      clubs: '["Club A", "Club B"]',
      nationalities: '["GB"]',
      is_active: 1,
      last_synced_at: null,
    });

    const player = await getPlayerById('player-1');

    expect(player).not.toBeNull();
    expect(player?.name).toBe('Test Player');
    expect(player?.clubs).toEqual(['Club A', 'Club B']);
    expect(player?.isActive).toBe(true);
  });
});

describe('didPlayerPlayFor', () => {
  let mockDb: {
    execAsync: jest.Mock;
    runAsync: jest.Mock;
    getFirstAsync: jest.Mock;
    getAllAsync: jest.Mock;
    closeAsync: jest.Mock;
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockDb = {
      execAsync: jest.fn().mockResolvedValue(undefined),
      runAsync: jest.fn().mockResolvedValue({ lastInsertRowId: 1, changes: 1 }),
      getFirstAsync: jest.fn().mockResolvedValue({ user_version: 4 }),
      getAllAsync: jest.fn().mockResolvedValue([]),
      closeAsync: jest.fn().mockResolvedValue(undefined),
    };

    (SQLite.openDatabaseAsync as jest.Mock).mockResolvedValue(mockDb);
    await initDatabase();
  });

  afterEach(async () => {
    await closeDatabase();
  });

  it('returns true when player clubs contain exact match', async () => {
    mockDb.getFirstAsync.mockResolvedValueOnce({
      id: 'player-1',
      external_id: null,
      name: 'Test Player',
      search_name: 'test player',
      clubs: '["Barcelona", "Real Madrid", "Manchester United"]',
      nationalities: '["ES"]',
      is_active: 1,
      last_synced_at: null,
    });

    const result = await didPlayerPlayFor('player-1', 'Barcelona');
    expect(result).toBe(true);
  });

  it('returns true with case-insensitive club match', async () => {
    mockDb.getFirstAsync.mockResolvedValueOnce({
      id: 'player-1',
      external_id: null,
      name: 'Test Player',
      search_name: 'test player',
      clubs: '["Barcelona", "Real Madrid"]',
      nationalities: '["ES"]',
      is_active: 1,
      last_synced_at: null,
    });

    const result = await didPlayerPlayFor('player-1', 'BARCELONA');
    expect(result).toBe(true);
  });

  it('returns true with fuzzy club name match (minor typo)', async () => {
    mockDb.getFirstAsync.mockResolvedValueOnce({
      id: 'player-1',
      external_id: null,
      name: 'Test Player',
      search_name: 'test player',
      clubs: '["Real Madrid CF"]',
      nationalities: '["ES"]',
      is_active: 1,
      last_synced_at: null,
    });

    // "Real Madrid" should match "Real Madrid CF" (fuzzy tolerance)
    const result = await didPlayerPlayFor('player-1', 'Real Madrid');
    expect(result).toBe(true);
  });

  it('returns false for non-matching club', async () => {
    mockDb.getFirstAsync.mockResolvedValueOnce({
      id: 'player-1',
      external_id: null,
      name: 'Test Player',
      search_name: 'test player',
      clubs: '["Barcelona", "Real Madrid"]',
      nationalities: '["ES"]',
      is_active: 1,
      last_synced_at: null,
    });

    const result = await didPlayerPlayFor('player-1', 'Liverpool');
    expect(result).toBe(false);
  });

  it('returns false for non-existent player', async () => {
    mockDb.getFirstAsync.mockResolvedValueOnce(null);

    const result = await didPlayerPlayFor('non-existent', 'Barcelona');
    expect(result).toBe(false);
  });
});

describe('hasNationality', () => {
  let mockDb: {
    execAsync: jest.Mock;
    runAsync: jest.Mock;
    getFirstAsync: jest.Mock;
    getAllAsync: jest.Mock;
    closeAsync: jest.Mock;
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockDb = {
      execAsync: jest.fn().mockResolvedValue(undefined),
      runAsync: jest.fn().mockResolvedValue({ lastInsertRowId: 1, changes: 1 }),
      getFirstAsync: jest.fn().mockResolvedValue({ user_version: 4 }),
      getAllAsync: jest.fn().mockResolvedValue([]),
      closeAsync: jest.fn().mockResolvedValue(undefined),
    };

    (SQLite.openDatabaseAsync as jest.Mock).mockResolvedValue(mockDb);
    await initDatabase();
  });

  afterEach(async () => {
    await closeDatabase();
  });

  it('returns true when player has the nationality', async () => {
    mockDb.getFirstAsync.mockResolvedValueOnce({
      id: 'player-1',
      external_id: null,
      name: 'Test Player',
      search_name: 'test player',
      clubs: '["Club A"]',
      nationalities: '["BR", "IT"]',
      is_active: 1,
      last_synced_at: null,
    });

    const result = await hasNationality('player-1', 'BR');
    expect(result).toBe(true);
  });

  it('returns true with lowercase nationality code', async () => {
    mockDb.getFirstAsync.mockResolvedValueOnce({
      id: 'player-1',
      external_id: null,
      name: 'Test Player',
      search_name: 'test player',
      clubs: '["Club A"]',
      nationalities: '["FR"]',
      is_active: 1,
      last_synced_at: null,
    });

    const result = await hasNationality('player-1', 'fr');
    expect(result).toBe(true);
  });

  it('returns false when player does not have the nationality', async () => {
    mockDb.getFirstAsync.mockResolvedValueOnce({
      id: 'player-1',
      external_id: null,
      name: 'Test Player',
      search_name: 'test player',
      clubs: '["Club A"]',
      nationalities: '["BR"]',
      is_active: 1,
      last_synced_at: null,
    });

    const result = await hasNationality('player-1', 'DE');
    expect(result).toBe(false);
  });

  it('returns false for non-existent player', async () => {
    mockDb.getFirstAsync.mockResolvedValueOnce(null);

    const result = await hasNationality('non-existent', 'BR');
    expect(result).toBe(false);
  });
});
