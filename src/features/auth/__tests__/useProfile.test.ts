import { renderHook, waitFor } from '@testing-library/react-native';
import { supabase } from '@/lib/supabase';
import { useProfile } from '../hooks/useProfile';

describe('useProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns null profile when userId is null', () => {
    // Act
    const { result } = renderHook(() => useProfile(null));

    // Assert
    expect(result.current.profile).toBeNull();
    expect(result.current.isPremium).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it('fetches profile and exposes is_premium status as true', async () => {
    // Arrange
    const mockProfile = {
      id: 'user-123',
      display_name: 'TestUser',
      username: null,
      avatar_url: null,
      is_premium: true,
      premium_purchased_at: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockProfile, error: null }),
        }),
      }),
    });

    (supabase.channel as jest.Mock).mockReturnValue({
      on: jest.fn().mockReturnValue({
        subscribe: jest.fn(),
      }),
    });

    // Act
    const { result } = renderHook(() => useProfile('user-123'));

    // Assert
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.profile).toEqual(mockProfile);
    expect(result.current.isPremium).toBe(true);
    expect(result.current.displayName).toBe('TestUser');
  });

  it('returns isPremium false when profile has is_premium: false', async () => {
    // Arrange
    const mockProfile = {
      id: 'user-123',
      display_name: 'FreeUser',
      username: null,
      avatar_url: null,
      is_premium: false,
      premium_purchased_at: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockProfile, error: null }),
        }),
      }),
    });

    (supabase.channel as jest.Mock).mockReturnValue({
      on: jest.fn().mockReturnValue({
        subscribe: jest.fn(),
      }),
    });

    // Act
    const { result } = renderHook(() => useProfile('user-123'));

    // Assert
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isPremium).toBe(false);
  });

  it('returns isPremium false when is_premium is null', async () => {
    // Arrange
    const mockProfile = {
      id: 'user-123',
      display_name: null,
      username: null,
      avatar_url: null,
      is_premium: null,
      premium_purchased_at: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockProfile, error: null }),
        }),
      }),
    });

    (supabase.channel as jest.Mock).mockReturnValue({
      on: jest.fn().mockReturnValue({
        subscribe: jest.fn(),
      }),
    });

    // Act
    const { result } = renderHook(() => useProfile('user-123'));

    // Assert
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isPremium).toBe(false);
  });

  it('identifies when display name is needed', async () => {
    // Arrange
    const mockProfile = {
      id: 'user-123',
      display_name: null,
      username: null,
      avatar_url: null,
      is_premium: false,
      premium_purchased_at: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockProfile, error: null }),
        }),
      }),
    });

    (supabase.channel as jest.Mock).mockReturnValue({
      on: jest.fn().mockReturnValue({
        subscribe: jest.fn(),
      }),
    });

    // Act
    const { result } = renderHook(() => useProfile('user-123'));

    // Assert
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.needsDisplayName).toBe(true);
  });

  it('handles fetch error gracefully', async () => {
    // Arrange
    const mockError = new Error('Network error');

    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: null, error: mockError }),
        }),
      }),
    });

    (supabase.channel as jest.Mock).mockReturnValue({
      on: jest.fn().mockReturnValue({
        subscribe: jest.fn(),
      }),
    });

    // Act
    const { result } = renderHook(() => useProfile('user-123'));

    // Assert
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.profile).toBeNull();
  });

  describe('fresh install scenarios', () => {
    it('creates profile when PGRST116 error (row not found)', async () => {
      // Arrange - First call returns PGRST116, second call (insert) succeeds
      const pgrst116Error = { code: 'PGRST116', message: 'Row not found' };
      const newProfile = {
        id: 'new-user-123',
        display_name: null,
        username: null,
        avatar_url: null,
        is_premium: false,
        premium_purchased_at: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const selectMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: null, error: pgrst116Error }),
        }),
      });

      const insertMock = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: newProfile, error: null }),
        }),
      });

      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: selectMock,
            insert: insertMock,
          };
        }
        return {};
      });

      (supabase.channel as jest.Mock).mockReturnValue({
        on: jest.fn().mockReturnValue({
          subscribe: jest.fn(),
        }),
      });

      // Act
      const { result } = renderHook(() => useProfile('new-user-123'));

      // Assert
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(insertMock).toHaveBeenCalledWith({ id: 'new-user-123' });
      expect(result.current.profile).toEqual(newProfile);
      expect(result.current.needsDisplayName).toBe(true);
    });

    it('sets isLoading false even when profile creation fails', async () => {
      // Arrange - Both fetch and insert fail
      const pgrst116Error = { code: 'PGRST116', message: 'Row not found' };
      const createError = { code: 'INSERT_ERROR', message: 'Insert failed' };

      const selectMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: null, error: pgrst116Error }),
        }),
      });

      const insertMock = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: null, error: createError }),
        }),
      });

      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: selectMock,
            insert: insertMock,
          };
        }
        return {};
      });

      (supabase.channel as jest.Mock).mockReturnValue({
        on: jest.fn().mockReturnValue({
          subscribe: jest.fn(),
        }),
      });

      // Act
      const { result } = renderHook(() => useProfile('new-user-123'));

      // Assert - isLoading must become false to prevent infinite loading
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.profile).toBeNull();
    });

    it('times out if profile fetch hangs', async () => {
      // Arrange - Simulate hanging fetch (promise never resolves)
      jest.useFakeTimers();

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockReturnValue(new Promise(() => {})), // Never resolves
          }),
        }),
      });

      (supabase.channel as jest.Mock).mockReturnValue({
        on: jest.fn().mockReturnValue({
          subscribe: jest.fn(),
        }),
      });

      // Act
      const { result } = renderHook(() => useProfile('user-123'));

      // Fast-forward past the timeout (10 seconds) and flush promises
      await jest.advanceTimersByTimeAsync(11000);

      // Assert - Should timeout and set loading to false
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error?.message).toContain('timed out');

      jest.useRealTimers();
    });
  });
});
