/**
 * TransferGuessOGCard — dynamic OG image for the Transfer Guess game.
 *
 * Shows from-club → to-club with fee, and locked hint pills.
 * The player name (answer) is NOT included or rendered.
 *
 * Satori constraints: inline styles, display:'flex' on all containers.
 */

import { OG_COLORS, GAME_ACCENT_COLORS } from './og-tokens';
import { OGCardShell } from './OGCardShell';
import { LockIcon } from './og-icons';

export interface TransferGuessOGCardProps {
  fromClub: string;
  toClub: string;
  fee: string;
  fromClubColor?: string;
  toClubColor?: string;
  fromClubAbbreviation?: string;
  toClubAbbreviation?: string;
}

function ClubBadge({
  name,
  abbreviation,
  color,
}: {
  name: string;
  abbreviation?: string;
  color?: string;
}) {
  const bgColor = color || '#374151';
  const abbr = abbreviation || name.slice(0, 3).toUpperCase();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 72,
          height: 72,
          borderRadius: 999,
          backgroundColor: bgColor,
          border: '2px solid rgba(255, 255, 255, 0.15)',
        }}
      >
        <span
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: OG_COLORS.floodlightWhite,
            letterSpacing: 1,
          }}
        >
          {abbr}
        </span>
      </div>
      <span
        style={{
          fontSize: 14,
          fontWeight: 500,
          color: OG_COLORS.textSecondary,
          maxWidth: 140,
          textAlign: 'center',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {name}
      </span>
    </div>
  );
}

const HINT_LABELS = ['Year', 'Position', 'Nationality'];

export function TransferGuessOGCard({
  fromClub,
  toClub,
  fee,
  fromClubColor,
  toClubColor,
  fromClubAbbreviation,
  toClubAbbreviation,
}: TransferGuessOGCardProps) {
  return (
    <OGCardShell accentColor={GAME_ACCENT_COLORS.transferGuess} subtitle="Transfer Guess">
      {/* Who made this transfer? */}
      <div
        style={{
          display: 'flex',
          fontSize: 14,
          fontWeight: 600,
          color: OG_COLORS.textSecondary,
          letterSpacing: 2,
          textTransform: 'uppercase',
          marginBottom: 20,
        }}
      >
        Who made this transfer?
      </div>

      {/* Club → Club layout */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 40,
          marginBottom: 16,
        }}
      >
        <ClubBadge
          name={fromClub}
          abbreviation={fromClubAbbreviation}
          color={fromClubColor}
        />

        {/* Arrow + fee */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span
            style={{
              fontSize: 32,
              color: OG_COLORS.textSecondary,
            }}
          >
            →
          </span>
          <span
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: GAME_ACCENT_COLORS.transferGuess,
            }}
          >
            {fee}
          </span>
        </div>

        <ClubBadge
          name={toClub}
          abbreviation={toClubAbbreviation}
          color={toClubColor}
        />
      </div>

      {/* Locked hints */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          justifyContent: 'center',
        }}
      >
        {HINT_LABELS.map((label) => (
          <div
            key={label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              borderRadius: 999,
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <LockIcon size={14} />
            <span
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: OG_COLORS.textSecondary,
                opacity: 0.7,
              }}
            >
              {label}
            </span>
          </div>
        ))}
      </div>
    </OGCardShell>
  );
}
