import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  FadeIn,
  interpolate,
  Extrapolation,
  Easing,
} from 'react-native-reanimated';
import { Footprints, CheckCircle, Circle } from 'lucide-react-native';
import Svg, { Circle as SvgCircle, Path } from 'react-native-svg';
import { colors, spacing, fonts, borderRadius, shadows, glows } from '@/theme';
import { CareerStep } from '../types/careerPath.types';
import { LockedCard } from './LockedCard';
import { GlassCard } from '@/components/GlassCard';

function FootballIcon({ size = 12, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <SvgCircle cx={12} cy={12} r={11} stroke={color} strokeWidth={2} />
      <Path
        d="M12 1 L9 8 L3 8 L7.5 13 L5.5 20 L12 16 L18.5 20 L16.5 13 L21 8 L15 8 Z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

export interface CareerStepCardProps {
  step: CareerStep;
  stepNumber: number;
  isRevealed: boolean;
  isLatest: boolean;
  isWinningStep?: boolean;
  isMissedStep?: boolean;
  forceReveal?: boolean;
  revealDelay?: number;
  isVictoryReveal?: boolean;
  testID?: string;
}

export function CareerStepCard({
  step,
  stepNumber,
  isRevealed,
  isLatest,
  testID,
  isWinningStep = false,
  isMissedStep = false,
  forceReveal = false,
  revealDelay = 0,
  isVictoryReveal = false,
}: CareerStepCardProps) {
  // --- Animations ---
  const currentPulse = useSharedValue(1);
  const victoryProgress = useSharedValue(0);

  const currentYear = new Date().getFullYear();
  const isCurrentClub = step.endYear === null;
  const isLoan = step.type === 'loan';

  React.useEffect(() => {
    // Pulse animation only for the truly active current club
    if ((isRevealed || forceReveal) && isCurrentClub) {
      currentPulse.value = withRepeat(
        withSequence(
          withTiming(0.4, { duration: 800 }),
          withTiming(1, { duration: 800 })
        ),
        -1,
        true
      );
    }
  }, [isRevealed, forceReveal, isCurrentClub, currentPulse]);

  // Victory reveal animation
  React.useEffect(() => {
    if (forceReveal && !isRevealed) {
        const timer = setTimeout(() => {
          victoryProgress.value = withSpring(1, {
            damping: 10,
            stiffness: 120,
            mass: 0.8,
          });
        }, revealDelay);
        return () => clearTimeout(timer);
    }
  }, [forceReveal, revealDelay, isRevealed, victoryProgress]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: currentPulse.value,
  }));

  const victoryAnimatedStyle = useAnimatedStyle(() => {
      if (!forceReveal || isRevealed) return {};
      return {
        opacity: victoryProgress.value,
        transform: [
          { translateY: interpolate(victoryProgress.value, [0, 1], [20, 0], Extrapolation.CLAMP) },
          { scale: interpolate(victoryProgress.value, [0, 1], [0.95, 1], Extrapolation.CLAMP) },
        ],
      };
  });

  // --- Logic ---
  const formattedYear = useMemo(() => step.year, [step.year]);
  const showAsRevealed = isRevealed || forceReveal;

  // --- Styles ---
  // We use GlassCard, so valid styles pass through commonly.
  // Exception: Loan and Current overrides.
  
  // ... (Animations and Logic above remains)

  const getCardStyle = () => {
      // Wrapper style (shadow, etc)
      const style: any = {};
      
      if (isLoan) {
          style.borderLeftColor = colors.cardYellow;
          style.borderLeftWidth = 3;
          style.backgroundColor = 'rgba(250, 204, 21, 0.05)';
          style.borderTopWidth = 0;
          style.borderBottomWidth = 0;
          style.borderRightWidth = 0;
      }
      
      if (isCurrentClub) {
          // No special background — keep it consistent with other cards
      }

      return style;
  };
  
  const getBorderColor = () => {
     if (isLoan) return 'transparent'; // Handled by wrapper or just transparent
     if (isCurrentClub) return 'transparent';
     if (isWinningStep) return colors.pitchGreen;
     if (isMissedStep) return colors.redCard;
     return 'transparent'; // Default for standard cards!
  };

  if (!showAsRevealed) {
    return (
      <View style={styles.lockedWrapper}>
        <LockedCard stepNumber={stepNumber} testID={testID} />
      </View>
    );
  }

  return (
    <Animated.View 
      entering={FadeIn.delay(forceReveal && !isRevealed ? 0 : revealDelay)} 
      style={[styles.wrapper, forceReveal && !isRevealed ? victoryAnimatedStyle : undefined]} 
      testID={testID}
    >
        <GlassCard 
            intensity={20} 
            style={getCardStyle()}
            borderColor={getBorderColor()}
            contentStyle={{ paddingHorizontal: 12, paddingVertical: 8 }}
            testID={testID ? `${testID}-glass` : undefined}
        >
           <View style={styles.contentPadding}>
             {/* TOP ROW: Name | Year */}
             <View style={styles.topRow}>
               <Text style={styles.clubName} numberOfLines={1}>
                 {step.text}
               </Text>

               {/* Right Side: Year Only */}
               <View style={styles.yearContainer}>
                 {/* Pulse for current club */}
                 {isCurrentClub && (
                   <Animated.View style={[styles.activeDot, pulseStyle]} />
                 )}
                 <Text style={[
                   styles.yearText, 
                   isCurrentClub && styles.yearTextCurrent
                 ]}>
                   {formattedYear}
                 </Text>
               </View>
             </View>

             {/* BOTTOM ROW: Stats | LOAN Badge */}
             <View style={styles.bottomRow}>
               <View style={styles.statsContainer}>
                  {(step.apps !== undefined || step.goals !== undefined) && (
                    <>
                      {step.apps !== undefined && (
                        <View style={styles.statPill}>
                           <Footprints size={12} color={colors.textSecondary} /> 
                           <Text style={styles.statText}>{step.apps}</Text>
                        </View>
                      )}
                      
                      {step.goals !== undefined && (
                        <View style={styles.statPill}>
                           <FootballIcon size={12} color={colors.textSecondary} />
                           <Text style={styles.statText}>{step.goals}</Text>
                        </View>
                      )}
                    </>
                  )}
               </View>
                  
                {/* Loan Badge - Right Aligned */}
                {isLoan && (
                  <View style={styles.loanBadge}>
                    <Text style={styles.loanText}>LOAN</Text>
                  </View>
                )}
             </View>
             
              {/* Review Mode Icon */}
              {isWinningStep && (
                <View style={styles.reviewIconContainer} testID="winning-badge">
                   <CheckCircle size={20} color={colors.pitchGreen} />
                </View>
              )}
           </View>
        </GlassCard>

      {/* Missed Badge */}
      {isMissedStep && (
          <View style={styles.missedBadge} testID="missed-badge">
            <Text style={styles.missedBadgeText}>MISSED</Text>
          </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.md, // Increased spacing per feedback
    flex: 1,
  },
  lockedWrapper: {
    marginBottom: spacing.md, // Increased spacing for locked cards too
  },
  contentPadding: {
    padding: 0, 
    gap: 4, 
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start', 
  },
  metaContainer: {
    alignItems: 'flex-end',
    gap: 4,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  clubName: {
    fontFamily: fonts.body,
    fontWeight: '700',
    fontSize: 14,
    color: colors.floodlightWhite,
    flex: 1,
    marginRight: spacing.sm,
    paddingTop: 2, 
  },
  yearContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  yearText: {
    fontFamily: fonts.headline, 
    fontSize: 14,
    color: colors.textSecondary,
    opacity: 0.9,
    letterSpacing: 0.5,
  },
  yearTextCurrent: {
    color: colors.floodlightWhite,
  },
  yearTextLoan: {
    color: 'rgba(255, 255, 255, 0.5)', 
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.pitchGreen,
  },
  loanBadge: {
    backgroundColor: colors.cardYellow,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  loanText: {
    fontFamily: fonts.headline,
    fontSize: 10,
    color: colors.stadiumNavy,
    includeFontPadding: false,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  statText: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  missedBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: colors.redCard,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    transform: [{rotate: '12deg'}],
    zIndex: 10,
  },
  missedBadgeText: {
    fontFamily: fonts.body,
    color: colors.floodlightWhite,
    fontWeight: '800',
    fontSize: 10,
  },
  reviewIconContainer: {
      position: 'absolute',
      right: 0,
      bottom: 0,
  }
});
