/**
 * GameOGCard Component
 *
 * Satori-compatible JSX component for generating Open Graph images
 * for Football IQ's web playable games.
 * This is rendered server-side by @vercel/og to create dynamic social preview images.
 *
 * Satori constraints:
 * - Uses inline styles only (no className)
 * - Limited CSS properties supported
 * - display: 'flex' required for all container elements
 * - No CSS grid, no Tailwind classes
 */

// Design tokens matching the mobile app and ScoutingReportOGCard
const COLORS = {
  stadiumNavy: '#0F172A',
  pitchGreen: '#58CC02',
  floodlightWhite: '#F8FAFC',
  textSecondary: '#94A3B8',
  glassBorder: 'rgba(255, 255, 255, 0.1)',
  cardBackground: '#1a2744',
};

export interface GameOGCardProps {
  gameTitle: string;   // e.g. "Career Path"
  tagline: string;     // e.g. "Guess the player from their career"
  accentColor: string; // e.g. "#58CC02"
}

/**
 * OG Image card component for Football IQ web games.
 * Dimensions: 1200x630 (standard OG image size)
 */
export function GameOGCard({ gameTitle, tagline, accentColor }: GameOGCardProps) {
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
          padding: 56,
          border: `3px solid ${accentColor}`,
          width: 640,
        }}
      >
        {/* FOOTBALL IQ Header */}
        <div
          style={{
            display: 'flex',
            fontSize: 36,
            fontWeight: 700,
            color: COLORS.pitchGreen,
            letterSpacing: 4,
            marginBottom: 32,
          }}
        >
          FOOTBALL IQ
        </div>

        {/* Game Title */}
        <div
          style={{
            display: 'flex',
            fontSize: 48,
            fontWeight: 700,
            color: accentColor,
            marginBottom: 20,
            textAlign: 'center',
          }}
        >
          {gameTitle}
        </div>

        {/* Tagline */}
        <div
          style={{
            display: 'flex',
            fontSize: 22,
            fontWeight: 400,
            color: COLORS.textSecondary,
            marginBottom: 40,
            textAlign: 'center',
          }}
        >
          {tagline}
        </div>

        {/* Divider */}
        <div
          style={{
            width: '100%',
            height: 1,
            backgroundColor: COLORS.glassBorder,
            marginBottom: 32,
          }}
        />

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            fontSize: 20,
            fontWeight: 600,
            color: COLORS.pitchGreen,
            letterSpacing: 1,
          }}
        >
          Play free at footballiq.app
        </div>
      </div>
    </div>
  );
}
