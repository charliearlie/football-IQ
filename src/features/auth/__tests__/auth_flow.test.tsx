import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { supabase } from '@/lib/supabase';
import { AuthProvider, useAuth } from '../context/AuthContext';

// Mock useProfile to avoid issues with profile fetching in auth tests
jest.mock('../hooks/useProfile', () => ({
  useProfile: () => ({
    profile: null,
    isLoading: false,
    error: null,
    isPremium: false,
    displayName: null,
    needsDisplayName: false,
    refetch: jest.fn(),
  }),
}));

describe('Auth Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  it('calls signInAnonymously when no existing session', async () => {
    // Arrange - No existing session
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    (supabase.auth.signInAnonymously as jest.Mock).mockResolvedValue({
      data: {
        session: {
          user: { id: 'anon-user-123', is_anonymous: true },
          access_token: 'token',
        },
      },
      error: null,
    });

    (supabase.auth.onAuthStateChange as jest.Mock).mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    });

    // Act
    renderHook(() => useAuth(), { wrapper });

    // Assert
    await waitFor(() => {
      expect(supabase.auth.signInAnonymously).toHaveBeenCalledTimes(1);
    });
  });

  it('does not call signInAnonymously when session exists', async () => {
    // Arrange - Existing session
    const existingSession = {
      user: { id: 'existing-user-123', is_anonymous: false },
      access_token: 'existing-token',
    };

    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: existingSession },
      error: null,
    });

    (supabase.auth.onAuthStateChange as jest.Mock).mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    });

    // Act
    const { result } = renderHook(() => useAuth(), { wrapper });

    // Assert
    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true);
    });

    expect(supabase.auth.signInAnonymously).not.toHaveBeenCalled();
    expect(result.current.user?.id).toBe('existing-user-123');
  });

  it('sets isAnonymous true for anonymous user session', async () => {
    // Arrange
    const anonymousSession = {
      user: { id: 'anon-user-123', is_anonymous: true },
      access_token: 'token',
    };

    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: anonymousSession },
      error: null,
    });

    (supabase.auth.onAuthStateChange as jest.Mock).mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    });

    // Act
    const { result } = renderHook(() => useAuth(), { wrapper });

    // Assert
    await waitFor(() => {
      expect(result.current.isAnonymous).toBe(true);
    });
  });

  it('sets isAnonymous false for non-anonymous user session', async () => {
    // Arrange
    const regularSession = {
      user: { id: 'user-123', is_anonymous: false, email: 'test@example.com' },
      access_token: 'token',
    };

    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: regularSession },
      error: null,
    });

    (supabase.auth.onAuthStateChange as jest.Mock).mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    });

    // Act
    const { result } = renderHook(() => useAuth(), { wrapper });

    // Assert
    await waitFor(() => {
      expect(result.current.isAnonymous).toBe(false);
    });
  });

  it('signInWithOTP calls supabase with shouldCreateUser: false', async () => {
    // Arrange
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: { user: { id: 'anon-user', is_anonymous: true } } },
      error: null,
    });

    (supabase.auth.signInWithOtp as jest.Mock).mockResolvedValue({
      data: {},
      error: null,
    });

    (supabase.auth.onAuthStateChange as jest.Mock).mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    });

    // Act
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true);
    });

    await act(async () => {
      await result.current.signInWithOTP('test@example.com');
    });

    // Assert - shouldCreateUser: false links to existing anonymous account
    expect(supabase.auth.signInWithOtp).toHaveBeenCalledWith({
      email: 'test@example.com',
      options: { shouldCreateUser: false },
    });
  });

  it('verifyOTP calls supabase with correct params', async () => {
    // Arrange
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: { user: { id: 'anon-user', is_anonymous: true } } },
      error: null,
    });

    (supabase.auth.verifyOtp as jest.Mock).mockResolvedValue({
      data: { session: { user: { id: 'linked-user', is_anonymous: false } } },
      error: null,
    });

    (supabase.auth.onAuthStateChange as jest.Mock).mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    });

    // Act
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true);
    });

    await act(async () => {
      await result.current.verifyOTP('test@example.com', '123456');
    });

    // Assert
    expect(supabase.auth.verifyOtp).toHaveBeenCalledWith({
      email: 'test@example.com',
      token: '123456',
      type: 'email',
    });
  });

  it('isInitialized is false initially and true after initialization', async () => {
    // Arrange
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: { user: { id: 'user-123' } } },
      error: null,
    });

    (supabase.auth.onAuthStateChange as jest.Mock).mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    });

    // Act
    const { result } = renderHook(() => useAuth(), { wrapper });

    // Assert - Initially not initialized
    expect(result.current.isInitialized).toBe(false);

    // Wait for initialization
    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true);
    });
  });
});
