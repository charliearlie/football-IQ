/**
 * Integrity Feature
 *
 * Provides time integrity checking to prevent clock manipulation.
 * Users who manipulate their device clock will see a blocking overlay.
 *
 * Also provides data rehydration after app reinstall.
 */

export { IntegrityGuardProvider, useIntegrity } from './context/IntegrityContext';
export { RehydrationProvider, useRehydration } from './context/RehydrationContext';
export {
  needsRehydration,
  performRehydration,
  clearRehydrationFlag,
  DATA_FLOOR_DATE,
  MAX_ATTEMPTS_TO_PULL,
  REHYDRATION_FLAG_KEY,
} from './services/RehydrationService';
export type { RehydrationResult } from './services/RehydrationService';
