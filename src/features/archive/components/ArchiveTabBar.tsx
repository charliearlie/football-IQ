/**
 * ArchiveTabBar Component
 *
 * Two-pill segmented control for switching between archive views.
 * "BY GAME" toggles the per-mode grid; "BY DATE" toggles the calendar.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { HOME_COLORS, HOME_FONTS } from '@/theme/home-design';
import { triggerLight } from '@/lib/haptics';

// ============================================================================
// Types
// ============================================================================

export interface ArchiveTabBarProps {
  activeTab: 'byGame' | 'byDate';
  onTabChange: (tab: 'byGame' | 'byDate') => void;
}

// ============================================================================
// Constants
// ============================================================================

const SPRING_CONFIG = { damping: 15, stiffness: 300, mass: 0.5 };
const PILL_DEPTH = 3;

const TABS: { key: 'byGame' | 'byDate'; label: string }[] = [
  { key: 'byGame', label: 'BY GAME' },
  { key: 'byDate', label: 'BY DATE' },
];

// ============================================================================
// TabPill — individual animated pill inside the segmented control
// ============================================================================

interface TabPillProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
}

function TabPill({ label, isActive, onPress }: TabPillProps) {
  const translateY = useSharedValue(0);

  const handlePressIn = () => {
    if (isActive) {
      translateY.value = withSpring(PILL_DEPTH, SPRING_CONFIG);
    }
  };

  const handlePressOut = () => {
    if (isActive) {
      translateY.value = withSpring(0, SPRING_CONFIG);
    }
  };

  const handlePress = () => {
    triggerLight();
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (isActive) {
    return (
      <View style={[styles.pillWrapper, { paddingBottom: PILL_DEPTH }]}>
        {/* Green shadow layer behind active pill */}
        <View style={styles.pillShadow} />
        <Animated.View style={animatedStyle}>
          <Pressable
            style={[styles.pill, styles.pillActive]}
            onPress={handlePress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            accessibilityRole="tab"
            accessibilityState={{ selected: true }}
            accessibilityLabel={label}
          >
            <Text style={[styles.pillText, styles.pillTextActive]}>
              {label}
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={styles.pillWrapper}>
      <Pressable
        style={styles.pill}
        onPress={handlePress}
        accessibilityRole="tab"
        accessibilityState={{ selected: false }}
        accessibilityLabel={label}
      >
        <Text style={styles.pillText}>{label}</Text>
      </Pressable>
    </View>
  );
}

// ============================================================================
// ArchiveTabBar
// ============================================================================

/**
 * Segmented tab bar for the Archive redesign.
 *
 * Renders two pills inside a recessed dark container.
 * The active pill is filled with pitch-green (#58CC02) with a green
 * shadow layer; inactive pills are transparent with muted text.
 */
export function ArchiveTabBar({ activeTab, onTabChange }: ArchiveTabBarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.track}>
        {TABS.map((tab) => (
          <TabPill
            key={tab.key}
            label={tab.label}
            isActive={activeTab === tab.key}
            onPress={() => onTabChange(tab.key)}
          />
        ))}
      </View>
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  track: {
    height: 45,
    borderRadius: 12,
    backgroundColor: '#0B1120',
    borderWidth: 1,
    borderColor: HOME_COLORS.border,
    padding: 3,
    flexDirection: 'row',
  },
  pillWrapper: {
    flex: 1,
  },
  pill: {
    flex: 1,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 9,
  },
  pillActive: {
    backgroundColor: HOME_COLORS.pitchGreen,
  },
  pillShadow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: PILL_DEPTH,
    backgroundColor: HOME_COLORS.grassShadow,
    borderRadius: 9,
  },
  pillText: {
    fontFamily: HOME_FONTS.heading,
    fontSize: 14,
    letterSpacing: 1,
    color: 'rgba(248,250,252,0.5)',
  },
  pillTextActive: {
    color: '#0F172A',
  },
});
