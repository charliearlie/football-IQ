// Context & Provider
export { AuthProvider, useAuth } from './context/AuthContext';
export {
  SubscriptionSyncProvider,
  useSubscriptionSync,
} from './context/SubscriptionSyncContext';
export { OnboardingProvider, useOnboarding } from './context/OnboardingContext';

// Hooks
export { useProfile } from './hooks/useProfile';

// Services
export {
  checkPremiumEntitlement,
  syncPremiumToSupabase,
  identifyUser,
  logOutUser,
  waitForEntitlementActivation,
  silentRestorePurchases,
  ENTITLEMENT_RETRY_CONFIG,
} from './services/SubscriptionSync';
export {
  storeAuthCredentials,
  getStoredCredentials,
  clearStoredCredentials,
  setOnboardingCompleted,
  isOnboardingCompletedSecure,
  updateRefreshToken,
  SECURE_KEYS,
} from './services/SecureIdentityService';

// Components
export { AuthLoadingScreen } from './components/AuthLoadingScreen';
export { FirstRunModal } from './components/FirstRunModal';
export { BriefingScreen } from './components/BriefingScreen';
export { PremiumGate } from './components/PremiumGate';

// Constants
export {
  BRIEFING_FIXTURES,
  ONBOARDING_STORAGE_KEY,
  type BriefingFixture,
} from './constants/briefingSchedule';

// Types
export type { Profile, AuthState, AuthContextValue } from './types/auth.types';
export type {
  EntitlementCheckResult,
  EntitlementActivationResult,
  SilentRestoreResult,
} from './services/SubscriptionSync';
export type { StoredCredentials } from './services/SecureIdentityService';
