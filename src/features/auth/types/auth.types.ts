import { Session, User } from '@supabase/supabase-js';
import { Tables } from '@/types/supabase';

/**
 * Profile row from the profiles table.
 */
export type Profile = Tables<'profiles'>;

/**
 * Auth state managed by AuthProvider.
 */
export interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isInitialized: boolean;
  isAnonymous: boolean;
}

/**
 * Auth context value with state and actions.
 */
export interface AuthContextValue extends AuthState {
  /** Sign in anonymously (called automatically on first launch) */
  signInAnonymously: () => Promise<{ error: Error | null }>;
  /** Request OTP code sent to email (for upgrading anonymous account) */
  signInWithOTP: (email: string) => Promise<{ error: Error | null }>;
  /** Verify OTP code to link email to account */
  verifyOTP: (email: string, token: string) => Promise<{ error: Error | null }>;
  /** Update the user's display name */
  updateDisplayName: (displayName: string) => Promise<{ error: Error | null }>;
  /** Sign out the current user */
  signOut: () => Promise<void>;
  /** Force refetch of profile data from Supabase */
  refetchProfile: () => Promise<void>;
}
