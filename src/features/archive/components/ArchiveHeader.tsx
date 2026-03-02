
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { HOME_COLORS, HOME_FONTS } from '@/theme/home-design';
import { fonts } from '@/theme/typography';
import { SkeletonBox } from '@/components/ui/Skeletons';

interface ArchiveHeaderProps {
  completedCount: number;
  totalCount: number;
  isLoading?: boolean;
}

export function ArchiveHeader({ completedCount, totalCount, isLoading }: ArchiveHeaderProps) {
  const showSkeleton = isLoading && completedCount === 0 && totalCount === 0;

  return (
    <View style={styles.container}>
      {/* Left: Title & Subtitle */}
      <View>
        <Text style={styles.title}>ARCHIVE</Text>
        <Text style={styles.subtitle}>YOUR SEASON HISTORY</Text>
      </View>

      {/* Right: Games Completed Stats */}
      <View style={styles.statsContainer}>
        <Text style={styles.statsLabel}>GAMES COMPLETED</Text>
        {showSkeleton ? (
          <SkeletonBox width={80} height={28} radius={6} />
        ) : (
          <View style={styles.scoreRow}>
            <Text style={styles.activeScore}>{completedCount}</Text>
            <Text style={styles.totalScore}> / {totalCount}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start', // Align top to handle multiline text if needed
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontFamily: HOME_FONTS.heading,
    fontSize: 28, // Matches HomeHeader brand size
    color: '#fff',
    marginBottom: 2,
    letterSpacing: 1,
  },
  subtitle: {
    fontFamily: HOME_FONTS.body,
    fontSize: 12,
    color: HOME_COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statsContainer: {
    alignItems: 'flex-end',
  },
  statsLabel: {
    fontFamily: HOME_FONTS.body,
    fontSize: 10,
    color: HOME_COLORS.textSecondary,
    marginBottom: 0,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  activeScore: {
    fontFamily: fonts.stats,
    fontSize: 24,
    color: HOME_COLORS.pitchGreen,
  },
  totalScore: {
    fontFamily: fonts.stats,
    fontSize: 18,
    color: '#fff',
  }
});
