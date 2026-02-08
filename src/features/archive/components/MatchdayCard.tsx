
import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, LayoutAnimation, Platform, UIManager } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronDown, ChevronUp, Lock, Trophy, Check, Play } from 'lucide-react-native';
import { HOME_COLORS, HOME_FONTS } from '@/theme/home-design';
import { colors, borderRadius } from '@/theme';
import { ElevatedButton } from '@/components/ElevatedButton';
import { ArchiveDateGroup, ArchivePuzzle } from '../types/archive.types';
import { getDayStatus, calculateDayStats, isDayLocked } from '../utils/dayStatus';
import { getGameModeConfig } from '@/features/puzzles/utils/gameModeConfig';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

interface MatchdayCardProps {
  dateGroup: ArchiveDateGroup;
  isPremium: boolean;
  onPuzzlePress: (puzzle: ArchivePuzzle) => void;
  initiallyExpanded?: boolean;
}

export function MatchdayCard({ 
  dateGroup, 
  isPremium, 
  onPuzzlePress,
  initiallyExpanded = false 
}: MatchdayCardProps) {
  const [expanded, setExpanded] = useState(initiallyExpanded);

  const { dateString, puzzles } = dateGroup;
  
  // Logic
  const status = useMemo(() => getDayStatus(puzzles), [puzzles]);
  const stats = useMemo(() => calculateDayStats(puzzles), [puzzles]);
  const isLocked = useMemo(() => isDayLocked(dateString, isPremium), [dateString, isPremium]);
  
  // Date Formatting (Native - No date-fns)
  const dateObj = new Date(dateString);
  const dayName = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
  const isToday = new Date().toDateString() === dateObj.toDateString();

  const handlePress = () => {
    // Animate expansion
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  // Styles based on state
  const isPerfect = status === 'perfect';
  // Today gets special glow/border
  const borderColor = isToday 
    ? HOME_COLORS.pitchGreen 
    : isPerfect 
      ? HOME_COLORS.cardYellow // Gold for perfect
      : 'rgba(255,255,255,0.1)';
      
  const backgroundColor = isLocked 
    ? 'rgba(0,0,0,0.3)' // Darker for locked
    : 'rgba(255,255,255,0.05)';

  const opacity = isLocked ? 0.6 : 1;

  return (
    <View style={[styles.container, { opacity }]}>
       <LinearGradient
        colors={isPerfect ? ['rgba(250, 204, 21, 0.05)', 'rgba(250, 204, 21, 0.1)'] : ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.05)']}
        style={[
            styles.cardHeader, 
            { borderColor, borderWidth: isToday ? 2 : 1 }
        ]}
      >
        <Pressable onPress={handlePress} style={styles.pressableContent}>
            {/* Left: Date Info */}
            <View style={styles.dateContainer}>
                <Text style={[styles.dateText, isToday && { color: HOME_COLORS.pitchGreen }]}>
                    {dayName}
                </Text>
                {isToday && (
                    <View style={styles.todayBadge}>
                        <Text style={styles.todayText}>TODAY</Text>
                    </View>
                )}
            </View>

            {/* Right: Stats & Icon */}
            <View style={styles.rightContainer}>
                {isLocked ? (
                   <Lock size={16} color={HOME_COLORS.cardYellow} />
                ) : isPerfect ? (
                    <View style={styles.perfectBadge}>
                        <Trophy size={14} color={HOME_COLORS.stadiumNavy} fill={HOME_COLORS.stadiumNavy} />
                        <Text style={styles.perfectText}>5/5</Text> 
                    </View>
                ) : (
                    <Text style={styles.statsText}>
                        {stats.completed}/{stats.total}
                    </Text>
                )}
                
                <View style={styles.iconSpacer}>
                    {expanded ? (
                        <ChevronUp size={20} color={HOME_COLORS.textSecondary} />
                    ) : (
                        <ChevronDown size={20} color={HOME_COLORS.textSecondary} />
                    )}
                </View>
            </View>
        </Pressable>

        {/* Progress Bar (Bottom of Header) */}
        {!isLocked && (
            <View style={styles.progressBarContainer}>
                {puzzles.map((p, index) => (
                    <View 
                        key={p.id} 
                        style={[
                            styles.progressSegment, 
                            { 
                                backgroundColor: p.status === 'done' 
                                    ? (isPerfect ? HOME_COLORS.cardYellow : HOME_COLORS.pitchGreen) 
                                    : 'rgba(255,255,255,0.1)',
                                flex: 1,
                                marginRight: index === puzzles.length - 1 ? 0 : 4
                            }
                        ]} 
                    />
                ))}
            </View>
        )}
      </LinearGradient>

      {/* Expanded Content */}
      {expanded && (
          <View style={styles.expandedContent}>
              {puzzles.map((puzzle) => (
                  <PuzzleRow 
                    key={puzzle.id} 
                    puzzle={puzzle} 
                    onPress={() => onPuzzlePress(puzzle)} 
                  />
              ))}
          </View>
      )}
    </View>
  );
}

// Inner Component for Puzzle Row
function PuzzleRow({ puzzle, onPress }: { puzzle: ArchivePuzzle; onPress: () => void }) {
    const isDone = puzzle.status === 'done';
    const isResume = puzzle.status === 'resume';

    // Button props based on UniverseGameCard logic
    type ButtonConfig = {
        title: string;
        variant?: 'primary' | 'secondary' | 'danger' | 'outline';
        topColor?: string;
        shadowColor?: string;
        borderColor?: string;
        icon?: React.ReactNode;
    }

    let buttonProps: ButtonConfig = {
        title: '', // Empty title for Play = Icon only
        variant: undefined,
        topColor: colors.pitchGreen,
        shadowColor: colors.grassShadow,
        borderColor: undefined,
        icon: <Play size={20} color={colors.stadiumNavy} fill={colors.stadiumNavy} />
    };

    if (isDone) {
        buttonProps = {
            title: 'Result',
            variant: 'secondary',
            topColor: '#1E293B',
            shadowColor: '#0A1628',
            borderColor: '#1E293B',
            icon: undefined,
        };
    } else if (isResume) {
        buttonProps = {
            title: 'Resume',
            variant: undefined,
            topColor: colors.cardYellow,
            shadowColor: '#D4A500',
            borderColor: undefined,
            icon: undefined, // Resume usually has text
        };
    }
    

    // Get game mode config (icon, title, color)
    const config = getGameModeConfig(puzzle.gameMode, true);

    return (
        <Pressable onPress={onPress} style={({pressed}) => [styles.puzzleRow, pressed && { backgroundColor: 'rgba(255,255,255,0.08)' }]}>
            {/* Icon/Status */}
            <View style={[styles.puzzleIcon, isDone && { borderColor: HOME_COLORS.pitchGreen }]}>
                {isDone ? (
                    <Check size={14} color={HOME_COLORS.pitchGreen} strokeWidth={3} />
                ) : (
                    // Use the specific game icon instead of generic play button
                    config.icon
                )}
            </View>
            
            <View style={styles.puzzleInfo}>
                <Text style={styles.puzzleTitle}>
                    {config.title.toUpperCase()}
                </Text>
                {/* Maybe difficulty stars? */}
            </View>

            {/* Action - ElevatedButton */}
            <View style={styles.actionContainer}>
                <ElevatedButton
                    title={buttonProps.title}
                    onPress={onPress}
                    size="small"
                    variant={buttonProps.variant}
                    topColor={buttonProps.topColor}
                    shadowColor={buttonProps.shadowColor}
                    borderColorOverride={buttonProps.borderColor}
                    icon={buttonProps.icon}
                    style={{ minWidth: isDone || isResume ? 80 : 44, height: 44 }} // Explicit 44px height/width for icon-only
                    textStyle={{ fontSize: 10, letterSpacing: 0.5 }} 
                    borderRadius={borderRadius.lg}
                    // For icon-only (Play), use padding to center 20px icon in 44px button
                    // standard small vertical is 10. Horizontal: (44-24)/2 = 10.
                    paddingHorizontal={isDone || isResume ? undefined : 12}
                    paddingVertical={isDone || isResume ? undefined : 10}
                />
            </View>
        </Pressable>
    )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardHeader: {
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden', // Contain the progress bar
  },
  pressableContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      paddingBottom: 24, // Space for progress bar
  },
  dateContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
  },
  dateText: {
      fontFamily: HOME_FONTS.heading,
      fontSize: 20,
      color: '#fff',
      letterSpacing: 0.5,
  },
  todayBadge: {
      backgroundColor: 'rgba(88, 204, 2, 0.2)',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
  },
  todayText: {
      fontFamily: HOME_FONTS.heading,
      fontSize: 12,
      color: HOME_COLORS.pitchGreen,
  },
  rightContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
  },
  statsText: {
      fontFamily: HOME_FONTS.heading,
      fontSize: 16,
      color: 'rgba(255,255,255,0.8)',
  },
  perfectBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: HOME_COLORS.cardYellow,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
  },
  perfectText: {
      fontFamily: HOME_FONTS.heading,
      fontSize: 12,
      color: HOME_COLORS.stadiumNavy,
  },
  iconSpacer: {
      width: 20,
      alignItems: 'center',
  },
  progressBarContainer: {
      flexDirection: 'row',
      height: 4,
      marginHorizontal: 16,
      marginBottom: 16, // Bottom padding
      marginTop: -8, // Pull up closer to content
      borderRadius: 2,
      overflow: 'hidden',
  },
  progressSegment: {
      borderRadius: 2,
  },
  
  // Expanded
  expandedContent: {
      marginTop: 2,
      backgroundColor: 'rgba(0,0,0,0.2)', // Slightly darker background for list
      borderBottomLeftRadius: 16,
      borderBottomRightRadius: 16,
      padding: 8,
  },
  puzzleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderRadius: 12,
      marginBottom: 4,
  },
  puzzleIcon: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: 'rgba(255,255,255,0.1)', // Lightened from 0.05
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.15)', // Lightened from 0.1
  },
  puzzleInfo: {
      flex: 1,
  },
  puzzleTitle: {
      fontFamily: HOME_FONTS.heading,
      fontSize: 14,
      color: '#fff',
      letterSpacing: 0.5,
  },
  actionContainer: {
      marginLeft: 12,
  }
});
