// Context & Provider
export { AuthProvider, useAuth } from './context/AuthContext';
export {
  SubscriptionSyncProvider,
  useSubscriptionSync,
} from './context/SubscriptionSyncContext';

// Hooks
export { useProfile } from './hooks/useProfile';

// Services
export {
  checkPremiumEntitlement,
  syncPremiumToSupabase,
  identifyUser,
  logOutUser,
} from './services/SubscriptionSync';

// Components
export { AuthLoadingScreen } from './components/AuthLoadingScreen';
export { FirstRunModal } from './components/FirstRunModal';
export { PremiumGate } from './components/PremiumGate';

// Types
export type { Profile, AuthState, AuthContextValue } from './types/auth.types';
export type { EntitlementCheckResult } from './services/SubscriptionSync';
