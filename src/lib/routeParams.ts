/**
 * Route Parameter Utilities
 *
 * Type-safe utilities for extracting route parameters from Expo Router.
 * Handles the fact that useLocalSearchParams returns string | string[] | undefined.
 */

/**
 * Safely extracts a single string value from route params.
 * Handles array values (takes first) and undefined.
 *
 * @param param - The raw param value from useLocalSearchParams
 * @returns The string value or undefined if not present
 *
 * @example
 * ```tsx
 * const params = useLocalSearchParams<{ puzzleId: string }>();
 * const puzzleId = extractSingleParam(params.puzzleId);
 * if (!puzzleId) return <Redirect href="/" />;
 * ```
 */
export function extractSingleParam(
  param: string | string[] | undefined
): string | undefined {
  if (param === undefined) return undefined;
  return Array.isArray(param) ? param[0] : param;
}
