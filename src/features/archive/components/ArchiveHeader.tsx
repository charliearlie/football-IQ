
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { HOME_COLORS, HOME_FONTS } from '@/theme/home-design';

interface ArchiveHeaderProps {
  completedCount: number;
  totalCount: number;
}

export function ArchiveHeader({ completedCount, totalCount }: ArchiveHeaderProps) {
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
        <View style={styles.scoreRow}>
          <Text style={styles.activeScore}>{completedCount}</Text>
          <Text style={styles.totalScore}> / {totalCount}</Text>
        </View>
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
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
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
    color: 'rgba(248, 250, 252, 0.7)', // textSecondary
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statsContainer: {
    alignItems: 'flex-end',
  },
  statsLabel: {
    fontFamily: HOME_FONTS.body,
    fontSize: 10,
    color: 'rgba(248, 250, 252, 0.5)',
    marginBottom: 0,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  activeScore: {
    fontFamily: HOME_FONTS.heading,
    fontSize: 24,
    color: HOME_COLORS.pitchGreen,
  },
  totalScore: {
    fontFamily: HOME_FONTS.heading,
    fontSize: 18,
    color: '#fff',
  }
});
