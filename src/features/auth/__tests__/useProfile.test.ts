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
});
