/**
 * GameModeIcon Component
 *
 * Renders the correct icon for each game mode using custom SVGs.
 * Falls back to lucide icons for modes without custom artwork.
 * Uses SvgXml from react-native-svg (same pattern as FlagIcon).
 */

import React, { memo } from 'react';
import { SvgXml } from 'react-native-svg';
import { Grid3X3, Link, Shirt, HelpCircle } from 'lucide-react-native';
import { colors } from '@/theme';
import { GameMode } from '@/features/puzzles/types/puzzle.types';

const SVG_STRINGS: Partial<Record<GameMode, string>> = {
  career_path: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#58CC02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M 4 20 C 4 10, 20 14, 20 4" />
  <circle cx="4" cy="20" r="2.5" fill="#58CC02" stroke="#0F172A" stroke-width="2" />
  <circle cx="12" cy="12" r="2.5" fill="#58CC02" stroke="#0F172A" stroke-width="2" />
  <circle cx="20" cy="4" r="2.5" fill="#58CC02" stroke="#0F172A" stroke-width="2" />
</svg>`,

  guess_the_transfer: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
  <path d="M4 7h16M16 3l4 4-4 4M20 17H4M8 13l-4 4 4 4" stroke="#46A302" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" transform="translate(1, 1)" />
  <path d="M4 7h16M16 3l4 4-4 4M20 17H4M8 13l-4 4 4 4" stroke="#58CC02" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
  <circle cx="13" cy="13" r="5" fill="#0F172A" />
  <circle cx="12" cy="12" r="5" fill="#FACC15" stroke="#0F172A" stroke-width="2" />
  <path d="M13.5 10.5 C13.5 8.5 11 8.5 11 10.5 V12.5 C11 14 10.5 14.5 10 15 H14.5 M9.5 12.5 H13" stroke="#0F172A" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
</svg>`,

  guess_the_goalscorers: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none">
  <g transform="translate(1, 1)">
    <rect x="10" y="2" width="4" height="3" rx="0.5" fill="#46A302" />
    <circle cx="12" cy="13" r="8" fill="#46A302" />
  </g>
  <rect x="10" y="2" width="4" height="3" rx="0.5" fill="#58CC02" stroke="#0F172A" stroke-width="2" stroke-linejoin="round" />
  <path d="M16.5 7.5 L19 5" stroke="#0F172A" stroke-width="2" stroke-linecap="round" />
  <circle cx="12" cy="13" r="8" fill="#58CC02" stroke="#0F172A" stroke-width="2" />
  <circle cx="12" cy="13" r="4" fill="#FFFFFF" stroke="#0F172A" stroke-width="2" />
  <path d="M12 10.5 L12 15.5 M9.5 13 L14.5 13" stroke="#0F172A" stroke-width="2" stroke-linecap="round" />
</svg>`,

  topical_quiz: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
  <g transform="translate(2, 2)">
    <rect x="3" y="3" width="16" height="16" rx="4" fill="#46A302" />
    <rect x="2" y="2" width="16" height="16" rx="4" fill="#58CC02" stroke="#0F172A" stroke-width="2" />
    <path d="M 8 8 A 2 2 0 1 1 12 8 C 12 10 10 10 10 12" fill="none" stroke="#0F172A" stroke-width="2" stroke-linecap="round" />
    <circle cx="10" cy="14.5" r="1.25" fill="#0F172A" />
  </g>
</svg>`,

  starting_xi: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
  <rect x="5" y="5" width="14" height="16" rx="2" fill="#46A302" />
  <rect x="5" y="4" width="14" height="16" rx="2" fill="#58CC02" stroke="#0F172A" stroke-width="2" />
  <g stroke="#F8FAFC" stroke-width="1" fill="none">
    <line x1="5" y1="12" x2="19" y2="12" />
    <circle cx="12" cy="12" r="2.5" />
  </g>
  <circle cx="12" cy="7" r="1" fill="#F8FAFC" />
  <circle cx="8" cy="9" r="1" fill="#F8FAFC" />
  <circle cx="16" cy="9" r="1" fill="#F8FAFC" />
</svg>`,

  top_tens: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none">
  <rect x="2" y="18" width="6" height="5" rx="1.5" fill="#46A302" />
  <rect x="9" y="14" width="6" height="9" rx="1.5" fill="#46A302" />
  <rect x="16" y="7" width="6" height="16" rx="1.5" fill="#46A302" />
  <rect x="1" y="17" width="6" height="5" rx="1.5" fill="#FACC15" stroke="#0F172A" stroke-width="2" stroke-linejoin="round" />
  <rect x="8" y="13" width="6" height="9" rx="1.5" fill="#FACC15" stroke="#0F172A" stroke-width="2" stroke-linejoin="round" />
  <rect x="15" y="6" width="6" height="16" rx="1.5" fill="#FACC15" stroke="#0F172A" stroke-width="2" stroke-linejoin="round" />
</svg>`,

  connections: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
  <rect x="3.5" y="3.5" width="7" height="7" rx="2" fill="#46A302" />
  <rect x="15.5" y="3.5" width="7" height="7" rx="2" fill="#46A302" />
  <rect x="3.5" y="14.5" width="7" height="7" rx="2" fill="#46A302" />
  <rect x="15.5" y="14.5" width="7" height="7" rx="2" fill="#46A302" />
  <path d="M9.5 9.5 L12 12 L14.5 9.5 M9.5 13.5 L12 12 L14.5 13.5" stroke="#0F172A" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M9.5 9.5 L12 12 L14.5 9.5 M9.5 13.5 L12 12 L14.5 13.5" stroke="#F8FAFC" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
  <rect x="2.5" y="2.5" width="7" height="7" rx="2" fill="#3B82F6" stroke="#0F172A" stroke-width="2" stroke-linejoin="round" />
  <rect x="14.5" y="2.5" width="7" height="7" rx="2" fill="#F59E0B" stroke="#0F172A" stroke-width="2" stroke-linejoin="round" />
  <rect x="2.5" y="13.5" width="7" height="7" rx="2" fill="#FF4D00" stroke="#0F172A" stroke-width="2" stroke-linejoin="round" />
  <rect x="14.5" y="13.5" width="7" height="7" rx="2" fill="#14B8A6" stroke="#0F172A" stroke-width="2" stroke-linejoin="round" />
</svg>`,

  timeline: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none">
  <path d="M7 4L7 20" stroke="#0F172A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
  <g transform="translate(1, 1)">
    <circle cx="7" cy="4" r="3" fill="#46A302" />
    <circle cx="7" cy="12" r="3" fill="#46A302" />
    <circle cx="7" cy="20" r="3" fill="#46A302" />
  </g>
  <circle cx="7" cy="4" r="3" fill="#58CC02" stroke="#0F172A" stroke-width="2" />
  <circle cx="7" cy="12" r="3" fill="#58CC02" stroke="#0F172A" stroke-width="2" />
  <circle cx="7" cy="20" r="3" fill="#58CC02" stroke="#0F172A" stroke-width="2" />
  <path d="M17 5L17 19M13 15L17 19L21 15" stroke="#0F172A" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
</svg>`,
};

// career_path_pro reuses the career_path icon
SVG_STRINGS.career_path_pro = SVG_STRINGS.career_path;

/** Lucide icon color for fallback modes */
const LUCIDE_FALLBACK_COLOR = colors.pitchGreen;

export interface GameModeIconProps {
  gameMode: GameMode;
  size?: number;
}

function GameModeIconComponent({ gameMode, size = 24 }: GameModeIconProps) {
  const svg = SVG_STRINGS[gameMode];

  if (svg) {
    return <SvgXml xml={svg} width={size} height={size} />;
  }

  // Lucide fallbacks for modes without custom SVGs
  switch (gameMode) {
    case 'the_grid':
      return <Grid3X3 size={size} color={LUCIDE_FALLBACK_COLOR} />;
    case 'the_chain':
      return <Link size={size} color={LUCIDE_FALLBACK_COLOR} />;
    case 'the_thread':
      return <Shirt size={size} color={LUCIDE_FALLBACK_COLOR} />;
    default:
      return <HelpCircle size={size} color={colors.textSecondary} />;
  }
}

export const GameModeIcon = memo(GameModeIconComponent);
