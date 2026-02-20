/**
 * ScoutingReportOGCard Component
 *
 * Satori-compatible JSX component for generating Open Graph images.
 * This is rendered server-side by @vercel/og to create dynamic social preview images.
 *
 * Satori constraints:
 * - Uses inline styles only (no className)
 * - Limited CSS properties supported
 * - display: 'flex' required for flexbox
 * - Uses tw prop OR style prop (not both)
 */

import { OG_COLORS } from './og-tokens';

const COLORS = OG_COLORS;

// Tier color mapping
const TIER_COLORS: Record<number, string> = {
  1: COLORS.textSecondary,
  2: '#6B7280',
  3: '#3B82F6',
  4: '#22C55E',
  5: COLORS.pitchGreen,
  6: COLORS.pitchGreen,
  7: '#FACC15',
  8: '#F59E0B',
  9: '#F97316',
  10: '#FFD700',
};

// Tier thresholds
const IQ_TIERS = [
  { tier: 1, name: 'Intern', minPoints: 0 },
  { tier: 2, name: 'Match Analyst', minPoints: 25 },
  { tier: 3, name: 'Scout', minPoints: 100 },
  { tier: 4, name: 'Tactical Analyst', minPoints: 250 },
  { tier: 5, name: 'Chief Scout', minPoints: 500 },
  { tier: 6, name: 'Head of Analysis', minPoints: 1000 },
  { tier: 7, name: 'Head of Recruitment', minPoints: 2000 },
  { tier: 8, name: 'Technical Director', minPoints: 4000 },
  { tier: 9, name: 'Director of Football', minPoints: 8000 },
  { tier: 10, name: 'The Gaffer', minPoints: 20000 },
];

function getTierForPoints(totalIQ: number) {
  for (let i = IQ_TIERS.length - 1; i >= 0; i--) {
    if (totalIQ >= IQ_TIERS[i].minPoints) {
      return IQ_TIERS[i];
    }
  }
  return IQ_TIERS[0];
}

function getTierColor(tier: number): string {
  return TIER_COLORS[Math.min(Math.max(tier, 1), 10)];
}

export interface ScoutingReportOGCardProps {
  displayName: string;
  totalIQ: number;
}

/**
 * OG Image card component for Scout Reports.
 * Dimensions: 1200x630 (standard OG image size)
 */
export function ScoutingReportOGCard({
  displayName,
  totalIQ,
}: ScoutingReportOGCardProps) {
  const tier = getTierForPoints(totalIQ);
  const tierColor = getTierColor(tier.tier);
  const formattedIQ = totalIQ.toLocaleString();

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.stadiumNavy,
        padding: 60,
      }}
    >
      {/* Main Card */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          backgroundColor: COLORS.cardBackground,
          borderRadius: 24,
          padding: 48,
          border: `3px solid ${COLORS.pitchGreen}`,
          width: 600,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: 32,
          }}
        >
          <div
            style={{
              fontFamily: 'Bebas Neue',
              fontSize: 40,
              fontWeight: 400,
              color: COLORS.pitchGreen,
              letterSpacing: 6,
            }}
          >
            FOOTBALL IQ
          </div>
          <div
            style={{
              fontSize: 16,
              fontWeight: 500,
              color: COLORS.textSecondary,
              letterSpacing: 3,
              marginTop: 8,
            }}
          >
            SCOUT REPORT
          </div>
        </div>

        {/* Tier Section */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: 24,
          }}
        >
          {/* Tier Badge */}
          <div
            style={{
              display: 'flex',
              backgroundColor: tierColor,
              paddingLeft: 24,
              paddingRight: 24,
              paddingTop: 8,
              paddingBottom: 8,
              borderRadius: 999,
            }}
          >
            <span
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: COLORS.stadiumNavy,
                letterSpacing: 1,
              }}
            >
              {tier.name}
            </span>
          </div>
        </div>

        {/* Display Name */}
        <div
          style={{
            fontSize: 28,
            fontWeight: 600,
            color: COLORS.floodlightWhite,
            marginBottom: 24,
          }}
        >
          {displayName}
        </div>

        {/* Divider */}
        <div
          style={{
            width: '100%',
            height: 1,
            backgroundColor: COLORS.glassBorder,
            marginBottom: 24,
          }}
        />

        {/* Total IQ Stat */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            marginBottom: 24,
          }}
        >
          <span
            style={{
              fontSize: 16,
              fontWeight: 500,
              color: COLORS.textSecondary,
              letterSpacing: 1,
              textTransform: 'uppercase',
            }}
          >
            Total IQ Accumulated
          </span>
          <span
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: COLORS.pitchGreen,
            }}
          >
            {formattedIQ}
          </span>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            fontSize: 18,
            fontWeight: 500,
            color: COLORS.pitchGreen,
            letterSpacing: 1,
          }}
        >
          football-iq.app
        </div>
      </div>
    </div>
  );
}
