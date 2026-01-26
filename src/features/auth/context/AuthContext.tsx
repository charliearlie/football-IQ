import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useProfile } from '../hooks/useProfile';
import { AuthContextValue, Profile } from '../types/auth.types';

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
    isPremium,
    displayName,
    needsDisplayName,
    totalIQ,
    refetch: refetchProfile,
    refreshLocalIQ,
  } = useProfile(user?.id ?? null);

  // Initialize auth on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check for existing session
        const { data: { session: existingSession } } = await supabase.auth.getSession();

        if (existingSession) {
          // Use existing session
          setSession(existingSession);
          setUser(existingSession.user);
          setIsAnonymous(existingSession.user.is_anonymous ?? false);
        } else {
          // Zero friction: auto sign-in anonymously
          const { data, error } = await supabase.auth.signInAnonymously();
          if (!error && data.session) {
            setSession(data.session);
            setUser(data.session.user);
            setIsAnonymous(true);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsLoading(false);
        setIsInitialized(true);
      }
    };

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setSession(newSession);
          setUser(newSession?.user ?? null);
          setIsAnonymous(newSession?.user?.is_anonymous ?? false);
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setIsAnonymous(false);
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
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access auth state and actions.
 * Must be used within an AuthProvider.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
