import React from 'react';
import { View, Text, StyleSheet, Pressable, Image, ImageSourcePropType } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, Lock, Check, Video, Crown, Gift } from 'lucide-react-native';
import { HOME_COLORS, HOME_FONTS, HOME_DIMENSIONS } from '@/theme/home-design';
import { GameMode } from '@/features/puzzles/types/puzzle.types';
import { CardStatus } from '../../hooks/useDailyPuzzles';
import { ProBadge } from '@/components/ProBadge/ProBadge';

// Duplicate of icons mapping for now - ideally refactor to shared config
const PUZZLE_ICONS: Partial<Record<GameMode, ImageSourcePropType>> = {
  career_path: require('../../../../../assets/images/puzzles/career-path.png'),
  career_path_pro: require('../../../../../assets/images/puzzles/career-path.png'),
  guess_the_transfer: require('../../../../../assets/images/puzzles/guess-the-transfer.png'),
  guess_the_goalscorers: require('../../../../../assets/images/puzzles/goalscorer-recall.png'),
  topical_quiz: require('../../../../../assets/images/puzzles/quiz.png'),
  starting_xi: require('../../../../../assets/images/puzzles/starting-xi.png'),
  top_tens: require('../../../../../assets/images/puzzles/top-tens.png'),
};

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
  const iconSource = PUZZLE_ICONS[gameMode];

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
                        style={({pressed}) => [styles.actionButton, styles.adButton, pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }]}
                     >
                        <Video size={16} color="#F8FAFC" />
                        <Text style={styles.adButtonText}>WATCH AD</Text>
                     </Pressable>

                     <Pressable 
                        onPress={onGoPro} 
                        style={({pressed}) => [styles.actionButton, styles.proButton, pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }]}
                     >
                        <ProBadge size={16} color={HOME_COLORS.stadiumNavy} />
                        <Text style={styles.proButtonText}>GO PRO</Text>
                     </Pressable>
                </View>
            </LinearGradient>
        </View>
    );
  }

  // Standard Card Layout (Horizontal Row)
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.container, pressed && { opacity: 0.95, transform: [{ scale: 0.98 }] }]}>
      <LinearGradient
        colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.05)']} // Flat glass
        style={styles.card}
      >
        {/* Left: Icon Box */}
        <View style={styles.iconBox}>
          {iconSource ? (
            <Image source={iconSource} style={styles.iconImage} resizeMode="contain" />
          ) : (
            <Play size={24} color={HOME_COLORS.pitchGreen} fill={HOME_COLORS.pitchGreen} />
          )}
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
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      borderRadius: 8,
      gap: 8,
  },
  adButton: { // Transparent / Glassy
      backgroundColor: 'rgba(255,255,255,0.05)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.2)',
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
    backgroundColor: 'rgba(255,255,255,0.1)', // Lighter background
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    marginRight: 16,
  },
  iconImage: {
    width: 28,
    height: 28,
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
