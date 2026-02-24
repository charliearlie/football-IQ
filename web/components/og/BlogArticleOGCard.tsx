/**
 * BlogArticleOGCard — Satori-compatible OG image for blog articles.
 *
 * Renders a branded 1200x630 card showing:
 *   - Football IQ branding via OGCardShell
 *   - Article title (prominent)
 *   - Top match results as compact score lines
 *   - Active competition tags
 *   - Formatted article date
 *
 * Satori constraints: inline styles only, display:'flex' on all containers.
 */

import { OGCardShell } from './OGCardShell';
import { OG_COLORS } from './og-tokens';

export interface BlogMatchResult {
  home: string;
  away: string;
  homeGoals: number;
  awayGoals: number;
}

export interface BlogArticleOGCardProps {
  title: string;
  matchResults: BlogMatchResult[];
  competitions: string[];
  date: string;
}

export function BlogArticleOGCard({
  title,
  matchResults,
  competitions,
  date,
}: BlogArticleOGCardProps) {
  // Show at most 3 match results
  const topMatches = matchResults.slice(0, 3);
  // Show at most 4 competition tags, truncated for Satori safety
  const topCompetitions = competitions
    .slice(0, 4)
    .map((c) => (c.length > 20 ? `${c.slice(0, 18)}...` : c));

  return (
    <OGCardShell accentColor={OG_COLORS.pitchGreen} subtitle="DAILY DIGEST" cardWidth={1080}>
      {/* Article title */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          fontFamily: 'Montserrat',
          fontSize: topMatches.length > 0 ? 32 : 38,
          fontWeight: 600,
          color: OG_COLORS.floodlightWhite,
          textAlign: 'center',
          lineHeight: 1.3,
          maxWidth: 900,
          marginBottom: topMatches.length > 0 ? 24 : 16,
        }}
      >
        {title.length > 80 ? `${title.slice(0, 77)}...` : title}
      </div>

      {/* Match results */}
      {topMatches.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
            marginBottom: 16,
          }}
        >
          {topMatches.map((match, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                fontFamily: 'Montserrat',
                fontSize: 20,
                color: OG_COLORS.textSecondary,
              }}
            >
              <span
                style={{
                  display: 'flex',
                  color: match.homeGoals > match.awayGoals
                    ? OG_COLORS.floodlightWhite
                    : OG_COLORS.textSecondary,
                  fontWeight: match.homeGoals > match.awayGoals ? 600 : 400,
                }}
              >
                {match.home}
              </span>
              <span
                style={{
                  display: 'flex',
                  fontFamily: 'Bebas Neue',
                  fontSize: 24,
                  color: OG_COLORS.pitchGreen,
                  letterSpacing: 2,
                  minWidth: 50,
                  justifyContent: 'center',
                }}
              >
                {match.homeGoals} - {match.awayGoals}
              </span>
              <span
                style={{
                  display: 'flex',
                  color: match.awayGoals > match.homeGoals
                    ? OG_COLORS.floodlightWhite
                    : OG_COLORS.textSecondary,
                  fontWeight: match.awayGoals > match.homeGoals ? 600 : 400,
                }}
              >
                {match.away}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Competition tags */}
      {topCompetitions.length > 0 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 8,
            marginBottom: 12,
          }}
        >
          {topCompetitions.map((comp, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                fontFamily: 'Montserrat',
                fontSize: 12,
                fontWeight: 600,
                color: OG_COLORS.pitchGreen,
                backgroundColor: 'rgba(88, 204, 2, 0.1)',
                border: '1px solid rgba(88, 204, 2, 0.25)',
                borderRadius: 100,
                padding: '4px 14px',
                textTransform: 'uppercase',
                letterSpacing: 1,
              }}
            >
              {comp}
            </div>
          ))}
        </div>
      )}

      {/* Date */}
      <div
        style={{
          display: 'flex',
          fontFamily: 'Montserrat',
          fontSize: 14,
          color: OG_COLORS.textSecondary,
          letterSpacing: 1,
        }}
      >
        {date}
      </div>
    </OGCardShell>
  );
}
