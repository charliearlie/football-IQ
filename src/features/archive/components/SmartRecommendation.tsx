import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Play } from 'lucide-react-native';
import { HOME_COLORS, HOME_FONTS } from '@/theme/home-design';
import { ElevatedButton } from '@/components/ElevatedButton';
import { GameModeIcon } from '@/components';
import { getGameModeConfig } from '@/features/puzzles/utils/gameModeConfig';
import { ArchiveDateGroup, ArchivePuzzle } from '../types/archive.types';
import { ModeStats } from '../hooks/useModeStats';
import { borderRadius, colors } from '@/theme';

// ============================================================================
// Types
// ============================================================================

interface SmartRecommendationProps {
  modeStats: ModeStats[];
  dateGroups: ArchiveDateGroup[];
  onPuzzlePress: (puzzle: ArchivePuzzle) => void;
}

type Recommendation = {
  puzzle: ArchivePuzzle;
  label: string;
  sublabel: string;
  borderColor: string;
  isResume: boolean;
} | null;

// ============================================================================
// Constants
// ============================================================================

const BORDER_COLOR_RESUME = 'rgba(46,252,93,0.3)';
const BORDER_COLOR_GREEN = 'rgba(46,252,93,0.3)';
const CARD_DEPTH = 6;

// ============================================================================
// Component
// ============================================================================

export function SmartRecommendation({
  modeStats,
  dateGroups,
  onPuzzlePress,
}: SmartRecommendationProps) {
  const recommendation = useMemo((): Recommendation => {
    // --- Priority 1: Resume in-progress ---
    const resumeMode = modeStats.find((m) => m.hasResume && m.resumePuzzle !== null);
    if (resumeMode && resumeMode.resumePuzzle) {
      const config = getGameModeConfig(resumeMode.gameMode);
      return {
        puzzle: resumeMode.resumePuzzle,
        label: 'PICK UP WHERE YOU LEFT OFF',
        sublabel: `${config.title} — In Progress`,
        borderColor: BORDER_COLOR_RESUME,
        isResume: true,
      };
    }

    // --- Priority 2: Almost-perfect day ---
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

    for (const group of dateGroups) {
      if (
        group.dateKey >= sevenDaysAgoStr &&
        group.totalCount > 1 &&
        group.completedCount === group.totalCount - 1
      ) {
        const missingPuzzle = group.puzzles.find((p) => p.status !== 'done') ?? null;
        if (missingPuzzle) {
          return {
            puzzle: missingPuzzle,
            label: `ONE GAME FROM A PERFECT ${group.dateLabel}`,
            sublabel: getGameModeConfig(missingPuzzle.gameMode).title,
            borderColor: BORDER_COLOR_GREEN,
            isResume: false,
          };
        }
      }
    }

    // --- Priority 3: Your best mode ---
    let bestMode: ModeStats | null = null;
    let bestRatio = -1;

    for (const mode of modeStats) {
      if (mode.playedCount > 0 && mode.hasUnplayed && mode.recentUnplayed !== null) {
        const ratio = mode.playedCount / mode.totalCount;
        if (ratio > bestRatio) {
          bestRatio = ratio;
          bestMode = mode;
        }
      }
    }

    if (bestMode && bestMode.recentUnplayed) {
      const config = getGameModeConfig(bestMode.gameMode);
      return {
        puzzle: bestMode.recentUnplayed,
        label: 'YOUR STRONGEST MODE',
        sublabel: config.title,
        borderColor: BORDER_COLOR_GREEN,
        isResume: false,
      };
    }

    // --- Priority 4: No recommendation ---
    return null;
  }, [modeStats, dateGroups]);

  if (!recommendation) {
    return null;
  }

  const buttonTopColor = colors.pitchGreen;
  const buttonShadowColor = colors.grassShadow;
  const iconColor = '#000000';

  return (
    <View>
      <Text style={styles.sectionLabel}>PLAY NEXT</Text>
      <View style={styles.cardOuter}>
        {/* Shadow Layer */}
        <View style={styles.shadowLayer} />

        {/* Top/Face Layer */}
        <View
          style={[
            styles.card,
            { borderColor: recommendation.borderColor },
          ]}
        >
          {/* Game Mode Icon */}
          <View style={styles.iconContainer}>
            <GameModeIcon gameMode={recommendation.puzzle.gameMode} size={26} />
          </View>

          {/* Text */}
          <View style={styles.textContainer}>
            <Text style={styles.label} numberOfLines={1}>
              {recommendation.label}
            </Text>
            <Text style={styles.sublabel} numberOfLines={1}>
              {recommendation.sublabel}
            </Text>
          </View>

          {/* Play Button */}
          <ElevatedButton
            title=""
            onPress={() => onPuzzlePress(recommendation.puzzle)}
            size="small"
            topColor={buttonTopColor}
            shadowColor={buttonShadowColor}
            icon={<Play size={20} color={iconColor} fill={iconColor} />}
            borderRadius={borderRadius.lg}
            style={styles.playButton}
            paddingHorizontal={12}
            paddingVertical={10}
          />
        </View>
      </View>
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  sectionLabel: {
    fontFamily: HOME_FONTS.heading,
    fontSize: 20,
    color: HOME_COLORS.pitchGreen,
    letterSpacing: 1,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  cardOuter: {
    marginHorizontal: 20,
    paddingBottom: CARD_DEPTH,
  },
  shadowLayer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: CARD_DEPTH,
    backgroundColor: HOME_COLORS.surfaceShadow,
    borderRadius: 20,
  },
  card: {
    height: 76,
    borderRadius: 20,
    backgroundColor: HOME_COLORS.surface,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontFamily: HOME_FONTS.heading,
    fontSize: 12,
    color: HOME_COLORS.textSecondary,
    letterSpacing: 1,
  },
  sublabel: {
    fontFamily: HOME_FONTS.heading,
    fontSize: 16,
    color: colors.floodlightWhite,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  playButton: {
    width: 44,
    height: 44,
    minWidth: 0,
    alignSelf: 'center',
  },
});
