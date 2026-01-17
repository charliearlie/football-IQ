/**
 * Integrity Feature
 *
 * Provides time integrity checking to prevent clock manipulation.
 * Users who manipulate their device clock will see a blocking overlay.
 */

export { IntegrityGuardProvider, useIntegrity } from './context/IntegrityContext';
