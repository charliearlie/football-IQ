/**
 * ConnectionsOGCard — dynamic OG image for the Connections game.
 *
 * Shows a 4x4 grid of shuffled player name tiles (the unplayed state).
 * Player names are safe to show — the answer is the categories, not the names.
 *
 * Satori constraints: inline styles, display:'flex', no CSS grid.
 */

import { OG_COLORS, GAME_ACCENT_COLORS } from './og-tokens';
import { OGCardShell } from './OGCardShell';

export interface ConnectionsOGCardProps {
  /** 16 player names, already shuffled. */
  players: string[];
}

export function ConnectionsOGCard({ players }: ConnectionsOGCardProps) {
  // Build 4 rows of 4 tiles
  const rows = [
    players.slice(0, 4),
    players.slice(4, 8),
    players.slice(8, 12),
    players.slice(12, 16),
  ];

  return (
    <OGCardShell accentColor={GAME_ACCENT_COLORS.connections} subtitle="Connections">
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          gap: 8,
        }}
      >
        {rows.map((row, rowIndex) => (
          <div
            key={rowIndex}
            style={{
              display: 'flex',
              gap: 8,
              width: '100%',
            }}
          >
            {row.map((name, colIndex) => (
              <div
                key={colIndex}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: 1,
                  height: 60,
                  borderRadius: 10,
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  padding: '0 8px',
                  overflow: 'hidden',
                }}
              >
                <span
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: OG_COLORS.floodlightWhite,
                    textAlign: 'center',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {name}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* CTA */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 14,
        }}
      >
        <span
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: GAME_ACCENT_COLORS.connections,
          }}
        >
          Find the 4 groups
        </span>
      </div>
    </OGCardShell>
  );
}
