import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, Check, Video, Gift } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { HOME_COLORS, HOME_FONTS } from '@/theme/home-design';
import { GameMode } from '@/features/puzzles/types/puzzle.types';
import { CardStatus } from '../../hooks/useDailyPuzzles';
import { ProBadge } from '@/components/ProBadge/ProBadge';
import { GameModeIcon } from '@/components';
import { useHaptics } from '@/hooks/useHaptics';

const SPRING_CONFIG = { damping: 15, stiffness: 300, mass: 0.5 };

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
    translateY.value = withSpring(2, SPRING_CONFIG);
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
        <View style={styles.container}>
            <LinearGradient
                colors={['rgba(255,255,255,0.05)', 'rgba(88, 204, 2, 0.05)']}
                style={[styles.card, styles.lockedCard]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                {/* Header Row */}
                <View style={styles.lockedHeader}>
                    <View style={styles.iconBox}>
                        {/* Use Gift icon for locked generic, or standard icon if available */}
                        {gameMode === 'career_path_pro' ? (
                            <ProBadge size={28} color={HOME_COLORS.cardYellow} />
                        ) : (
                             <Gift size={24} color={HOME_COLORS.cardYellow} />
                        )}
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
            </LinearGradient>
        </View>
    );
  }

  // Standard Card Layout (Horizontal Row)
  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.container}
    >
      <Animated.View style={animatedStyle}>
        <LinearGradient
          colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.05)']} // Flat glass
          style={styles.card}
        >
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
              status === 'resume' && styles.resumeButton
          ]}>
               {status === 'done' ? (
                   <Text style={styles.resultText}>VIEW</Text>
               ) : (
                   <Play
                      size={20}
                      color={status === 'resume' ? HOME_COLORS.cardYellow : '#0F172A'} // Navy icon on green bg
                      fill={status === 'resume' ? HOME_COLORS.cardYellow : '#0F172A'}
                      style={{ marginLeft: 2 }}
                   />
               )}
          </View>
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    marginHorizontal: 20,
    borderRadius: 16,
    // No shadow on container, shadow is on buttons
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12, // Reduced padding?
    borderRadius: 16, // Smoother radius
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  // Locked Styles
  lockedCard: {
      flexDirection: 'column',
      alignItems: 'stretch',
      padding: 16,
      borderColor: 'rgba(129, 140, 248, 0.3)', // Slight blue tint border
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
  adButton: { // Transparent / Glassy
      backgroundColor: 'rgba(255,255,255,0.05)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.2)',
      borderRadius: 8,
      overflow: 'hidden',
  },
  adButtonText: {
      fontFamily: HOME_FONTS.heading,
      fontSize: 16,
      color: '#F8FAFC',
      marginTop: 2,
  },
  proButton: { // Solid Yellow
      backgroundColor: HOME_COLORS.cardYellow,
      borderBottomWidth: 4,
      borderBottomColor: '#cda412', // Shadow
      borderRadius: 8,
      overflow: 'hidden',
  },
  proButtonText: {
      fontFamily: HOME_FONTS.heading,
      fontSize: 16,
      color: HOME_COLORS.stadiumNavy,
      marginTop: 2,
  },

  // Standard Styles
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12, // Squircle
    backgroundColor: '#F1F5F9', // Off-white for better icon visibility
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
    fontFamily: HOME_FONTS.heading, // Bebas Neue
    fontSize: 20,
    color: '#fff',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  subtitle: {
    fontFamily: HOME_FONTS.body, // Montserrat
    fontSize: 12,
    color: 'rgba(248, 250, 252, 0.7)',
  },

  // Play Button
  playButton: {
    width: 44, // Squircle dimensions
    height: 40,
    borderRadius: 12, // Squircle radius
    backgroundColor: HOME_COLORS.pitchGreen,
    justifyContent: 'center',
    alignItems: 'center',
    // 3D Shadow
    borderBottomWidth: 4,
    borderBottomColor: HOME_COLORS.grassShadow,
  },
  resumeButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: HOME_COLORS.cardYellow,
    borderBottomWidth: 2,
    borderBottomColor: HOME_COLORS.cardYellow,
  },
  resultButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderBottomColor: 'rgba(0,0,0,0.2)',
    borderBottomWidth: 0,
    height: 44, // Adjust for no border
  },
  resultText: {
      fontFamily: HOME_FONTS.heading,
      fontSize: 14,
      color: '#fff',
  }
});
