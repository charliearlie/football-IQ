import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { HOME_COLORS } from '@/theme/home-design';
import { fonts } from '@/theme';
import { triggerLight } from '@/lib/haptics';

export interface ArchiveTabBarProps {
  activeTab: 'byGame' | 'byDate';
  onTabChange: (tab: 'byGame' | 'byDate') => void;
}

const SPRING = { damping: 15, stiffness: 300, mass: 0.5 };
const DEPTH = 3;

function ActivePill({ label, onPress }: { label: string; onPress: () => void }) {
  const ty = useSharedValue(0);

  const anim = useAnimatedStyle(() => ({
    transform: [{ translateY: ty.value }],
  }));

  return (
    <View style={styles.pillSlot}>
      {/* Shadow / depth layer */}
      <View style={styles.shadow} />

      {/* Face layer — zIndex ensures it paints above the shadow */}
      <Animated.View style={[styles.face, anim]}>
        <Pressable
          style={styles.activePill}
          onPress={() => { triggerLight(); onPress(); }}
          onPressIn={() => { ty.value = withSpring(DEPTH, SPRING); }}
          onPressOut={() => { ty.value = withSpring(0, SPRING); }}
          accessibilityRole="tab"
          accessibilityState={{ selected: true }}
          accessibilityLabel={label}
        >
          <Text style={styles.activeText}>{label}</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

function InactivePill({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <View style={styles.pillSlot}>
      <Pressable
        style={styles.inactivePill}
        onPress={() => { triggerLight(); onPress(); }}
        accessibilityRole="tab"
        accessibilityState={{ selected: false }}
        accessibilityLabel={label}
      >
        <Text style={styles.inactiveText}>{label}</Text>
      </Pressable>
    </View>
  );
}

export function ArchiveTabBar({ activeTab, onTabChange }: ArchiveTabBarProps) {
  const tabs: { key: 'byGame' | 'byDate'; label: string }[] = [
    { key: 'byGame', label: 'BY GAME' },
    { key: 'byDate', label: 'BY DATE' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.track}>
        {tabs.map((t) =>
          activeTab === t.key ? (
            <ActivePill key={t.key} label={t.label} onPress={() => onTabChange(t.key)} />
          ) : (
            <InactivePill key={t.key} label={t.label} onPress={() => onTabChange(t.key)} />
          ),
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  track: {
    height: 48,
    borderRadius: 12,
    backgroundColor: HOME_COLORS.surface,
    borderWidth: 1,
    borderColor: HOME_COLORS.border,
    padding: 4,
    flexDirection: 'row',
  },
  pillSlot: {
    flex: 1,
    paddingBottom: DEPTH,
  },
  shadow: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: DEPTH,
    backgroundColor: HOME_COLORS.grassShadow,
    borderRadius: 9,
  },
  face: {
    flex: 1,
    zIndex: 1,
    elevation: 1,
  },
  activePill: {
    flex: 1,
    backgroundColor: '#2EFC5D',
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inactivePill: {
    flex: 1,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeText: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#000000',
  },
  inactiveText: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    letterSpacing: 1,
    color: 'rgba(255,255,255,0.6)',
  },
});
