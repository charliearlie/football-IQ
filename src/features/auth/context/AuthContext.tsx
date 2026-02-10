import React, { createContext, use, useEffect, useState, useCallback, useMemo } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useProfile } from '../hooks/useProfile';
import { AuthContextValue } from '../types/auth.types';
import {
  storeAuthCredentials,
  getStoredCredentials,
  clearStoredCredentials,
  updateRefreshToken,
} from '../services/SecureIdentityService';

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * Provides authentication state and actions to the app.
 *
 * On mount:
 * 1. Checks for existing session
 * 2. If no session, signs in anonymously (zero-friction start)
 * 3. Subscribes to auth state changes
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Profile subscription (only when we have a user)
  const {
    profile,
    isLoading: isProfileLoading,
    isPremium: _isPremium,
    displayName: _displayName,
    needsDisplayName: _needsDisplayName,
    totalIQ,
    refetch: refetchProfile,
    refreshLocalIQ,
  } = useProfile(user?.id ?? null);

  // Initialize auth on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check for existing session in AsyncStorage
        const { data: { session: existingSession } } = await supabase.auth.getSession();

        if (existingSession) {
          // Use existing session - also store credentials for reinstall recovery
          setSession(existingSession);
          setUser(existingSession.user);
          setIsAnonymous(existingSession.user.is_anonymous ?? false);

          // Store credentials in SecureStore for reinstall recovery
          if (existingSession.refresh_token) {
            await storeAuthCredentials(
              existingSession.user.id,
              existingSession.refresh_token
            );
          }
        } else {
          // No AsyncStorage session - check SecureStore (reinstall scenario)
          console.log('[Auth] No session in AsyncStorage, checking SecureStore...');
          const storedCredentials = await getStoredCredentials();

          if (storedCredentials) {
            // REINSTALL DETECTED - try to restore session with refresh token
            console.log('[Auth] Found stored credentials, attempting session restore...');
            const { data: refreshData, error: refreshError } =
              await supabase.auth.refreshSession({
                refresh_token: storedCredentials.refreshToken,
              });

            if (!refreshError && refreshData.session) {
              // Session restored successfully - same user as before reinstall
              console.log('[Auth] Session restored from SecureStore');
              setSession(refreshData.session);
              setUser(refreshData.session.user);
              setIsAnonymous(refreshData.session.user.is_anonymous ?? false);

              // Update stored refresh token (may have changed)
              if (refreshData.session.refresh_token) {
                await updateRefreshToken(refreshData.session.refresh_token);
              }
            } else {
              // Refresh failed - token may be expired
              console.log('[Auth] Session restore failed, creating new account');
              await clearStoredCredentials();
              await createNewAnonymousSession();
            }
          } else {
            // Fresh install - normal anonymous sign-in
            await createNewAnonymousSession();
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsLoading(false);
        setIsInitialized(true);
      }
    };

    const createNewAnonymousSession = async () => {
      const { data, error } = await supabase.auth.signInAnonymously();
      if (!error && data.session) {
        setSession(data.session);
        setUser(data.session.user);
        setIsAnonymous(true);

        // Store credentials for future reinstall recovery
        if (data.session.refresh_token) {
          await storeAuthCredentials(data.session.user.id, data.session.refresh_token);
        }
      }
    };

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setSession(newSession);
          setUser(newSession?.user ?? null);
          setIsAnonymous(newSession?.user?.is_anonymous ?? false);

          // Update stored refresh token when it changes
          if (newSession?.refresh_token && newSession?.user?.id) {
            await updateRefreshToken(newSession.refresh_token);
          }
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setIsAnonymous(false);

          // Clear stored credentials on sign out
          await clearStoredCredentials();
        }
      }
    );

    initializeAuth();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Auth actions
  const signInAnonymously = useCallback(async () => {
    const { error } = await supabase.auth.signInAnonymously();
    return { error: error as Error | null };
  }, []);

  const signInWithOTP = useCallback(async (email: string) => {
    // shouldCreateUser: false links email to existing anonymous account
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });
    return { error: error as Error | null };
  }, []);

  const verifyOTP = useCallback(async (email: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });
    return { error: error as Error | null };
  }, []);

  const updateDisplayName = useCallback(async (newDisplayName: string) => {
    if (!user?.id) {
      return { error: new Error('No user logged in') };
    }

    const { error } = await supabase
      .from('profiles')
      .update({ display_name: newDisplayName })
      .eq('id', user.id);

    // Refetch profile to update UI immediately
    if (!error) {
      await refetchProfile();
    }

    return { error: error as Error | null };
  }, [user?.id, refetchProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    session,
    user,
    profile,
    isLoading: isLoading || isProfileLoading,
    isInitialized,
    isAnonymous,
    signInAnonymously,
    signInWithOTP,
    verifyOTP,
    updateDisplayName,
    signOut,
    refetchProfile,
    refreshLocalIQ,
    totalIQ,
  }), [
    session,
    user,
    profile,
    isLoading,
    isProfileLoading,
    isInitialized,
    isAnonymous,
    signInAnonymously,
    signInWithOTP,
    verifyOTP,
    updateDisplayName,
    signOut,
    refetchProfile,
    refreshLocalIQ,
    totalIQ,
  ]);

  return (
    <AuthContext value={value}>
      {children}
    </AuthContext>
  );
}

/**
 * Hook to access auth state and actions.
 * Must be used within an AuthProvider.
 */
export function useAuth(): AuthContextValue {
  const context = use(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
