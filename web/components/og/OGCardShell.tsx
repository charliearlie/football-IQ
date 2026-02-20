/**
 * OGCardShell — reusable layout wrapper for all OG image cards.
 *
 * Renders the standard 1200x630 card frame used across every OG image:
 *   stadiumNavy background → inner card → FOOTBALL IQ header → children → footer
 *
 * Satori constraints apply: inline styles only, display:'flex' on all containers.
 */

import { OG_COLORS } from './og-tokens';

export interface OGCardShellProps {
  /** Accent color for the card border. */
  accentColor: string;
  /** Game-specific content rendered inside the card. */
  children: React.ReactNode;
  /** Optional subtitle shown below the FOOTBALL IQ header (e.g. "CAREER PATH"). */
  subtitle?: string;
  /** Card width – defaults to 1080 for puzzle previews, narrower for generic. */
  cardWidth?: number;
}

export function OGCardShell({
  accentColor,
  children,
  subtitle,
  cardWidth = 1080,
}: OGCardShellProps) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: OG_COLORS.stadiumNavy,
        padding: 40,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          backgroundColor: OG_COLORS.cardBackground,
          borderRadius: 24,
          padding: '32px 40px',
          border: `3px solid ${accentColor}`,
          width: cardWidth,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: 20,
          }}
        >
          <div
            style={{
              display: 'flex',
              fontSize: 28,
              fontWeight: 700,
              color: OG_COLORS.pitchGreen,
              letterSpacing: 4,
            }}
          >
            FOOTBALL IQ
          </div>
          {subtitle && (
            <div
              style={{
                display: 'flex',
                fontSize: 14,
                fontWeight: 500,
                color: OG_COLORS.textSecondary,
                letterSpacing: 3,
                marginTop: 6,
                textTransform: 'uppercase',
              }}
            >
              {subtitle}
            </div>
          )}
        </div>

        {/* Game-specific content */}
        {children}

        {/* Divider */}
        <div
          style={{
            width: '100%',
            height: 1,
            backgroundColor: OG_COLORS.glassBorder,
            marginTop: 20,
            marginBottom: 16,
          }}
        />

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            fontSize: 16,
            fontWeight: 600,
            color: OG_COLORS.pitchGreen,
            letterSpacing: 1,
          }}
        >
          Play free at football-iq.app
        </div>
      </div>
    </div>
  );
}
