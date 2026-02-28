import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Play, Check, Video } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { HOME_COLORS, HOME_FONTS } from '@/theme/home-design';
import { depthOffset } from '@/theme/spacing';
import { GameMode } from '@/features/puzzles/types/puzzle.types';
import { CardStatus } from '../../hooks/useDailyPuzzles';
import { ProBadge } from '@/components/ProBadge/ProBadge';
import { GameModeIcon } from '@/components';
import { useHaptics } from '@/hooks/useHaptics';

const SPRING_CONFIG = { damping: 15, stiffness: 300, mass: 0.5 };
const CARD_DEPTH = depthOffset.button;

interface GlassGameCardProps {
  gameMode: GameMode;
  status: CardStatus;
  title: string;
  subtitle: string;
  onPress: () => void;
  onWatchAd?: () => void;
  onGoPro?: () => void;
  isPremiumOnly?: boolean;
  isPremium?: boolean;
  isAdUnlocked?: boolean;
}

export function GlassGameCard({
  gameMode,
  status,
  title,
  subtitle,
  onPress,
  onWatchAd,
  onGoPro,
  isPremiumOnly,
  isPremium,
  isAdUnlocked,
}: GlassGameCardProps) {
  const isLocked = isPremiumOnly && !isPremium && !isAdUnlocked;
  const { triggerLight } = useHaptics();

  const translateY = useSharedValue(0);
  const adTranslateY = useSharedValue(0);
  const proTranslateY = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const adAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: adTranslateY.value }],
  }));

  const proAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: proTranslateY.value }],
  }));

  const handlePressIn = () => {
    translateY.value = withSpring(CARD_DEPTH, SPRING_CONFIG);
    triggerLight();
  };

  const handlePressOut = () => {
    translateY.value = withSpring(0, SPRING_CONFIG);
  };

  const handleAdPressIn = () => {
    adTranslateY.value = withSpring(2, SPRING_CONFIG);
    triggerLight();
  };

  const handleAdPressOut = () => {
    adTranslateY.value = withSpring(0, SPRING_CONFIG);
  };

  const handleProPressIn = () => {
    proTranslateY.value = withSpring(2, SPRING_CONFIG);
    triggerLight();
  };

  const handleProPressOut = () => {
    proTranslateY.value = withSpring(0, SPRING_CONFIG);
  };

  // Locked Card Layout (Vertical Stack)
  if (isLocked) {
    return (
      <View style={[styles.container, { paddingBottom: CARD_DEPTH }]}>
        {/* Shadow Layer */}
        <View style={[styles.cardShadow, { top: CARD_DEPTH }]} />
        {/* Top Face */}
        <View style={[styles.card, styles.lockedCard]}>
          {/* Header Row */}
          <View style={styles.lockedHeader}>
            <View style={styles.iconBox}>
              <GameModeIcon gameMode={gameMode} size={28} />
            </View>
            <View style={styles.content}>
              <Text style={[styles.title, { color: HOME_COLORS.cardYellow }]}>{title}</Text>
              <Text style={styles.subtitle}>{subtitle}</Text>
            </View>
          </View>

          {/* Actions Row */}
          <View style={styles.lockedActions}>
            <Pressable
              onPress={onWatchAd}
              onPressIn={handleAdPressIn}
              onPressOut={handleAdPressOut}
              style={[styles.actionButton, styles.adButton]}
            >
              <Animated.View style={[styles.actionButtonInner, adAnimatedStyle]}>
                <Video size={16} color="#F8FAFC" />
                <Text style={styles.adButtonText}>WATCH AD</Text>
              </Animated.View>
            </Pressable>

            <Pressable
              onPress={onGoPro}
              onPressIn={handleProPressIn}
              onPressOut={handleProPressOut}
              style={[styles.actionButton, styles.proButton]}
            >
              <Animated.View style={[styles.actionButtonInner, proAnimatedStyle]}>
                <ProBadge size={16} color={HOME_COLORS.stadiumNavy} />
                <Text style={styles.proButtonText}>GO PRO</Text>
              </Animated.View>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  // Standard Card Layout (Horizontal Row)
  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.container, { paddingBottom: CARD_DEPTH }]}
    >
      {/* Shadow Layer */}
      <View style={[styles.cardShadow, { top: CARD_DEPTH }]} />
      {/* Top Face */}
      <Animated.View style={[styles.card, animatedStyle]}>
        {/* Left: Icon Box */}
        <View style={styles.iconBox}>
          <GameModeIcon gameMode={gameMode} size={28} />
          {status === 'done' && (
            <View style={styles.checkBadge}>
              <Check size={10} color={HOME_COLORS.stadiumNavy} strokeWidth={4} />
            </View>
          )}
        </View>

        {/* Center: Title & Desc */}
        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>

        {/* Right: Squircle Play Button */}
        <View style={[
          styles.playButton,
          status === 'done' && styles.resultButton,
          status === 'resume' && styles.resumeButton,
        ]}>
          {status === 'done' ? (
            <Text style={styles.resultText}>VIEW</Text>
          ) : (
            <Play
              size={20}
              color={status === 'resume' ? HOME_COLORS.cardYellow : '#0F172A'}
              fill={status === 'resume' ? HOME_COLORS.cardYellow : '#0F172A'}
              style={{ marginLeft: 2 }}
            />
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    marginHorizontal: 20,
    borderRadius: 16,
  },
  cardShadow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: HOME_COLORS.surfaceShadow,
    borderRadius: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: HOME_COLORS.border,
    backgroundColor: HOME_COLORS.surface,
  },
  // Locked Styles
  lockedCard: {
    flexDirection: 'column',
    alignItems: 'stretch',
    padding: 16,
    borderColor: HOME_COLORS.border,
  },
  lockedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  lockedActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 8,
  },
  actionButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  adButton: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    overflow: 'hidden',
  },
  adButtonText: {
    fontFamily: HOME_FONTS.body,
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  proButton: {
    backgroundColor: HOME_COLORS.cardYellow,
    borderBottomWidth: 3,
    borderBottomColor: '#cda412',
    borderRadius: 8,
    overflow: 'hidden',
  },
  proButtonText: {
    fontFamily: HOME_FONTS.body,
    fontSize: 16,
    fontWeight: '800',
    color: HOME_COLORS.stadiumNavy,
  },

  // Standard Styles
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    marginRight: 16,
  },
  checkBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: HOME_COLORS.pitchGreen,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: HOME_COLORS.stadiumNavy,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontFamily: HOME_FONTS.heading, // Bebas Neue — game mode title
    fontSize: 20,
    color: '#fff',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  subtitle: {
    fontFamily: HOME_FONTS.body,
    fontSize: 12,
    color: HOME_COLORS.textSecondary,
  },

  // Play Button
  playButton: {
    width: 44,
    height: 40,
    borderRadius: 12,
    backgroundColor: HOME_COLORS.pitchGreen,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: HOME_COLORS.grassShadow,
  },
  resumeButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: HOME_COLORS.cardYellow,
    borderBottomWidth: 1,
    borderBottomColor: HOME_COLORS.cardYellow,
  },
  resultButton: {
    backgroundColor: HOME_COLORS.surface,
    borderBottomColor: 'rgba(0,0,0,0.2)',
    borderBottomWidth: 0,
    height: 44,
  },
  resultText: {
    fontFamily: HOME_FONTS.body,
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
});
