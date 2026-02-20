/**
 * TimelineOGCard — dynamic OG image for the Timeline game.
 *
 * Shows 6 event text cards in a shuffled order (the unplayed state).
 * Years are hidden — showing event text is safe since the answer is the order.
 *
 * Satori constraints: inline styles, display:'flex', no CSS grid.
 */

import { OG_COLORS, GAME_ACCENT_COLORS } from './og-tokens';
import { OGCardShell } from './OGCardShell';

export interface TimelineOGCardProps {
  /** 6 event texts, already shuffled. */
  events: string[];
  /** Optional subject label (e.g. "Thierry Henry"). */
  subject?: string;
}

export function TimelineOGCard({ events, subject }: TimelineOGCardProps) {
  return (
    <OGCardShell accentColor={GAME_ACCENT_COLORS.timeline} subtitle="Timeline">
      {/* Subject label */}
      {subject && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 12,
          }}
        >
          <span
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: GAME_ACCENT_COLORS.timeline,
            }}
          >
            {subject}
          </span>
        </div>
      )}

      {/* Event cards */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          gap: 6,
        }}
      >
        {events.map((text, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              height: 48,
              borderRadius: 10,
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '0 16px',
              gap: 12,
            }}
          >
            {/* Position number */}
            <span
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: GAME_ACCENT_COLORS.timeline,
                minWidth: 20,
              }}
            >
              {index + 1}
            </span>
            {/* Event text */}
            <span
              style={{
                fontSize: 15,
                fontWeight: 500,
                color: OG_COLORS.floodlightWhite,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1,
              }}
            >
              {text}
            </span>
            {/* Year placeholder */}
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: OG_COLORS.textSecondary,
              }}
            >
              ????
            </span>
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
            color: GAME_ACCENT_COLORS.timeline,
          }}
        >
          Sort into chronological order
        </span>
      </div>
    </OGCardShell>
  );
}
