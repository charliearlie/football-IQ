/**
 * Game Metadata Type Utilities
 *
 * Type guards and utilities for safely accessing game attempt metadata.
 * Metadata is stored as JSON in the database and parsed at runtime.
 */

/**
 * Safely narrow unknown metadata to a Record type.
 * Returns null if the metadata is not a valid object.
 *
 * @param metadata - Raw metadata value (could be anything)
 * @returns A Record<string, unknown> if valid, null otherwise
 *
 * @example
 * ```typescript
 * const data = asMetadataObject(attempt.metadata);
 * if (data) {
 *   const points = typeof data.points === 'number' ? data.points : 0;
 * }
 * ```
 */
export function asMetadataObject(
  metadata: unknown
): Record<string, unknown> | null {
  if (metadata && typeof metadata === 'object' && !Array.isArray(metadata)) {
    return metadata as Record<string, unknown>;
  }
  return null;
}

/**
 * Extract a number property from metadata with a default value.
 *
 * @param data - The metadata object
 * @param key - Property name to extract
 * @param defaultValue - Default if property is missing or not a number
 * @returns The number value or default
 */
export function getMetadataNumber(
  data: Record<string, unknown>,
  key: string,
  defaultValue: number = 0
): number {
  const value = data[key];
  return typeof value === 'number' ? value : defaultValue;
}

/**
 * Extract a string property from metadata with a default value.
 *
 * @param data - The metadata object
 * @param key - Property name to extract
 * @param defaultValue - Default if property is missing or not a string
 * @returns The string value or default
 */
export function getMetadataString(
  data: Record<string, unknown>,
  key: string,
  defaultValue: string = ''
): string {
  const value = data[key];
  return typeof value === 'string' ? value : defaultValue;
}

/**
 * Extract a boolean property from metadata with a default value.
 *
 * @param data - The metadata object
 * @param key - Property name to extract
 * @param defaultValue - Default if property is missing or not a boolean
 * @returns The boolean value or default
 */
export function getMetadataBoolean(
  data: Record<string, unknown>,
  key: string,
  defaultValue: boolean = false
): boolean {
  const value = data[key];
  return typeof value === 'boolean' ? value : defaultValue;
}

/**
 * Type guard for game result values used in tic-tac-toe metadata.
 */
export function isGameResult(value: unknown): value is 'win' | 'draw' | 'loss' {
  return value === 'win' || value === 'draw' || value === 'loss';
}
