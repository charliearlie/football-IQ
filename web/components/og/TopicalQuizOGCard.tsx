/**
 * TopicalQuizOGCard — dynamic OG image for the Topical Quiz game.
 *
 * Shows the first question with A/B/C/D options (no correct answer highlighted).
 *
 * Satori constraints: inline styles, display:'flex' on all containers.
 */

import { OG_COLORS, GAME_ACCENT_COLORS } from './og-tokens';
import { OGCardShell } from './OGCardShell';

export interface TopicalQuizOGCardProps {
  firstQuestion: string;
  options: [string, string, string, string];
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D'] as const;

export function TopicalQuizOGCard({
  firstQuestion,
  options,
}: TopicalQuizOGCardProps) {
  // Truncate long questions
  const displayQuestion =
    firstQuestion.length > 100
      ? firstQuestion.slice(0, 97) + '...'
      : firstQuestion;

  return (
    <OGCardShell accentColor={GAME_ACCENT_COLORS.topicalQuiz} subtitle="Topical Quiz">
      {/* Question counter */}
      <div
        style={{
          display: 'flex',
          fontSize: 13,
          fontWeight: 600,
          color: OG_COLORS.textSecondary,
          letterSpacing: 2,
          textTransform: 'uppercase',
          marginBottom: 12,
        }}
      >
        Question 1 of 5
      </div>

      {/* Question text */}
      <div
        style={{
          display: 'flex',
          fontSize: 22,
          fontWeight: 600,
          color: OG_COLORS.floodlightWhite,
          textAlign: 'center',
          lineHeight: 1.4,
          marginBottom: 20,
          maxWidth: 900,
        }}
      >
        {displayQuestion}
      </div>

      {/* Options grid: 2x2 layout */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          width: '100%',
        }}
      >
        {/* Row 1: A, B */}
        <div style={{ display: 'flex', gap: 8 }}>
          {options.slice(0, 2).map((option, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                flex: 1,
                gap: 10,
                padding: '12px 16px',
                borderRadius: 10,
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  fontSize: 14,
                  fontWeight: 700,
                  color: GAME_ACCENT_COLORS.topicalQuiz,
                  flexShrink: 0,
                }}
              >
                {OPTION_LETTERS[i]}
              </span>
              <span
                style={{
                  fontSize: 15,
                  fontWeight: 500,
                  color: OG_COLORS.floodlightWhite,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {option}
              </span>
            </div>
          ))}
        </div>
        {/* Row 2: C, D */}
        <div style={{ display: 'flex', gap: 8 }}>
          {options.slice(2, 4).map((option, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                flex: 1,
                gap: 10,
                padding: '12px 16px',
                borderRadius: 10,
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  fontSize: 14,
                  fontWeight: 700,
                  color: GAME_ACCENT_COLORS.topicalQuiz,
                  flexShrink: 0,
                }}
              >
                {OPTION_LETTERS[i + 2]}
              </span>
              <span
                style={{
                  fontSize: 15,
                  fontWeight: 500,
                  color: OG_COLORS.floodlightWhite,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {option}
              </span>
            </div>
          ))}
        </div>
      </div>
    </OGCardShell>
  );
}
