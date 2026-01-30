/**
 * TDD tests for WikidataService (Supabase RPC wrapper).
 * Tests written BEFORE implementation.
 *
 * Note: This service wraps Supabase RPC calls — it does NOT
 * execute SPARQL queries directly. SPARQL runs in the admin tool.
 */

import { searchPlayersOracle, validatePlayerClub } from '../WikidataService';
import { supabase } from '@/lib/supabase';

// Override the global supabase mock to add rpc
jest.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: jest.fn(),
  },
}));

// Access the mock after module resolution
const mockRpc = supabase.rpc as jest.Mock;

describe('searchPlayersOracle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns empty array for queries shorter than 3 characters', async () => {
    const results = await searchPlayersOracle('ab');
    expect(results).toEqual([]);
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('returns empty array for empty query', async () => {
    const results = await searchPlayersOracle('');
    expect(results).toEqual([]);
  });

  it('calls search_players_oracle RPC with correct parameters', async () => {
    const mockData = [
      {
        id: 'Q11571',
        name: 'Cristiano Ronaldo',
        scout_rank: 207,
        birth_year: 1985,
        position_category: 'Forward',
        nationality_code: 'PT',
        relevance_score: 1.0,
      },
    ];

    mockRpc.mockResolvedValueOnce({
      data: mockData,
      error: null,
    });

    const results = await searchPlayersOracle('ronaldo');

    expect(mockRpc).toHaveBeenCalledWith('search_players_oracle', {
      query_text: 'ronaldo',
      match_limit: 10,
    });
    expect(results).toEqual(mockData);
  });

  it('respects custom limit parameter', async () => {
    mockRpc.mockResolvedValueOnce({
      data: [],
      error: null,
    });

    await searchPlayersOracle('messi', 5);

    expect(mockRpc).toHaveBeenCalledWith('search_players_oracle', {
      query_text: 'messi',
      match_limit: 5,
    });
  });

  it('returns empty array on RPC error', async () => {
    mockRpc.mockResolvedValueOnce({
      data: null,
      error: { message: 'Network error' },
    });

    const results = await searchPlayersOracle('messi');
    expect(results).toEqual([]);
  });

  it('returns empty array when data is null', async () => {
    mockRpc.mockResolvedValueOnce({
      data: null,
      error: null,
    });

    const results = await searchPlayersOracle('messi');
    expect(results).toEqual([]);
  });
});

describe('validatePlayerClub', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns true when player-club relationship exists', async () => {
    mockRpc.mockResolvedValueOnce({
      data: true,
      error: null,
    });

    const result = await validatePlayerClub('Q11571', 'Q8682');

    expect(mockRpc).toHaveBeenCalledWith('validate_player_club', {
      player_qid: 'Q11571',
      club_qid: 'Q8682',
    });
    expect(result).toBe(true);
  });

  it('returns false when relationship does not exist', async () => {
    mockRpc.mockResolvedValueOnce({
      data: false,
      error: null,
    });

    const result = await validatePlayerClub('Q11571', 'Q99999');
    expect(result).toBe(false);
  });

  it('returns false on RPC error', async () => {
    mockRpc.mockResolvedValueOnce({
      data: null,
      error: { message: 'Connection failed' },
    });

    const result = await validatePlayerClub('Q11571', 'Q8682');
    expect(result).toBe(false);
  });
});
