/**
 * Re-export validation utilities from shared library.
 *
 * @deprecated Import directly from '@/lib/validation' instead.
 *
 * This file exists for backward compatibility. New code should import from:
 * import { validateGuess, normalizeString } from '@/lib/validation';
 */

export {
  validateGuess,
  normalizeString,
  MATCH_THRESHOLD,
} from '@/lib/validation';
