/**
 * CareerPathOGCard — dynamic OG image for the Career Path game.
 *
 * Shows the first career step revealed (club, years, apps/goals)
 * with remaining steps as locked "???" rows.
 *
 * Satori constraints: inline styles, display:'flex' on all containers,
 * no Tailwind, no lucide-react (use inline SVG for lock icon).
 */

import { OG_COLORS, GAME_ACCENT_COLORS } from './og-tokens';
import { OGCardShell } from './OGCardShell';
import { LockIcon } from './og-icons';

export interface CareerPathOGCardProps {
  firstStep: {
    text: string;
    year: string;
    type: 'club' | 'loan';
    apps?: number | null;
    goals?: number | null;
  };
  totalSteps: number;
}

export function CareerPathOGCard({ firstStep, totalSteps }: CareerPathOGCardProps) {
  const maxLockedRows = 5;
  const lockedCount = totalSteps - 1;
  const displayedLocked = Math.min(lockedCount, maxLockedRows);
  const extraCount = lockedCount - displayedLocked;

  return (
    <OGCardShell accentColor={GAME_ACCENT_COLORS.careerPath} subtitle="Career Path">
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          gap: 8,
        }}
      >
        {/* Revealed first step */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: '14px 20px',
            borderRadius: 12,
            backgroundColor: 'rgba(46, 252, 93, 0.08)',
            border: `2px solid ${GAME_ACCENT_COLORS.careerPath}`,
          }}
        >
          {/* Step number badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              borderRadius: 999,
              backgroundColor: GAME_ACCENT_COLORS.careerPath,
              fontSize: 16,
              fontWeight: 700,
              color: OG_COLORS.stadiumNavy,
              flexShrink: 0,
            }}
          >
            1
          </div>

          {/* Step details */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: OG_COLORS.floodlightWhite,
                }}
              >
                {firstStep.text}
              </span>
              {firstStep.type === 'loan' && (
                <span
                  style={{
                    display: 'flex',
                    fontSize: 11,
                    fontWeight: 700,
                    backgroundColor: '#FACC15',
                    color: OG_COLORS.stadiumNavy,
                    padding: '2px 8px',
                    borderRadius: 4,
                  }}
                >
                  LOAN
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 15, color: OG_COLORS.textSecondary }}>
                {firstStep.year}
              </span>
              {(firstStep.apps != null || firstStep.goals != null) && (
                <span style={{ fontSize: 13, color: OG_COLORS.textSecondary }}>
                  {firstStep.apps != null && `${firstStep.apps} Apps`}
                  {firstStep.apps != null && firstStep.goals != null && ' · '}
                  {firstStep.goals != null && `${firstStep.goals} Gls`}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Locked rows */}
        {Array.from({ length: displayedLocked }).map((_, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              padding: '14px 20px',
              borderRadius: 12,
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            {/* Step number badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
                borderRadius: 999,
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                fontSize: 16,
                fontWeight: 600,
                color: OG_COLORS.textSecondary,
                flexShrink: 0,
              }}
            >
              {i + 2}
            </div>

            <span
              style={{
                fontSize: 18,
                color: OG_COLORS.textSecondary,
                flex: 1,
                opacity: 0.6,
              }}
            >
              ???
            </span>

            <LockIcon size={18} />
          </div>
        ))}
      </div>

      {/* Extra count + CTA */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 12,
          gap: 8,
        }}
      >
        {extraCount > 0 && (
          <span style={{ fontSize: 14, color: OG_COLORS.textSecondary }}>
            +{extraCount} more clubs ·{' '}
          </span>
        )}
        <span
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: GAME_ACCENT_COLORS.careerPath,
          }}
        >
          Can you name the player?
        </span>
      </div>
    </OGCardShell>
  );
}
