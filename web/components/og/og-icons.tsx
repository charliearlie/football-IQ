/**
 * Shared SVG icons for OG image components.
 *
 * Satori cannot use lucide-react, so we render SVG paths inline.
 */

import { OG_COLORS } from './og-tokens';

/** Lock icon (from Lucide's Lock path data). */
export function LockIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={OG_COLORS.textSecondary}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
