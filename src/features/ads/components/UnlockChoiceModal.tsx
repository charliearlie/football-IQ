/**
 * UnlockChoiceModal Component
 *
 * Modal presenting two options to unlock an archived puzzle:
 * - "Go Premium" - Delegates to PremiumUpsellModal for subscription flow
 * - "Watch Ad to Unlock" - Shows rewarded ad for permanent access
 *
 * State Machine:
 * - idle: Shows two unlock options
 * - loading_ad: Loading rewarded ad
 * - showing_ad: Ad is being displayed
 * - ad_success: Ad completed, unlock granted (auto-closes)
 * - redirecting: DEPRECATED (Removed for manual confirmation)
 * - ad_error: Ad failed to load/show
 * - premium_flow: Delegated to PremiumUpsellModal
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  SlideInDown,
  FadeIn,
} from 'react-native-reanimated';
import {
  Unlock,
  Crown,
  Play,
  X,
  Check,
  AlertCircle,
  ArrowRight,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { ElevatedButton } from '@/components/ElevatedButton';
import { useAds } from '../context/AdContext';
import { formatPuzzleDate } from '@/features/archive/utils/dateGrouping';
import { GAME_MODE_ROUTES } from '@/features/archive/constants/routes';
import { UnlockChoiceModalProps, UnlockChoiceState } from '../types/ads.types';
import { colors } from '@/theme/colors';
import { spacing, borderRadius } from '@/theme/spacing';
import { fonts, textStyles } from '@/theme/typography';

/**
 * UnlockChoiceModal - Two-option unlock modal for archived puzzles.
 */
export function UnlockChoiceModal({
  visible,
  onClose,
  puzzleId,
  puzzleDate,
  gameMode,
  testID,
}: UnlockChoiceModalProps) {
  const router = useRouter();
  const [state, setState] = useState<UnlockChoiceState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { loadRewardedAd, showRewardedAd, grantAdUnlock, isRewardedAdReady } = useAds();

  // Track mounted state to prevent state updates after unmount
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Reset state when modal closes
  useEffect(() => {
    if (!visible) {
      setState('idle');
      setErrorMessage(null);
    }
  }, [visible]);

  // Pre-load rewarded ad when modal opens (only in idle state)
  // Don't re-load if we're in the middle of showing/completing an ad
  useEffect(() => {
    if (visible && state === 'idle' && !isRewardedAdReady) {
      loadRewardedAd().catch((error) => {
        console.warn('[UnlockChoiceModal] Failed to pre-load ad:', error);
      });
    }
  }, [visible, state, isRewardedAdReady, loadRewardedAd]);


  // IMPORTANT: No auto-navigation listeners.
  // We rely entirely on the user pressing "Play Now" or "Close".

  /**
   * Handle "Play Now" press (Manual Navigation)
   */
  const handlePlayNow = useCallback(() => {
    const route = GAME_MODE_ROUTES[gameMode];
    if (route && puzzleId) {
      // 1. Close Modal (to clear overlay)
      onClose();
      
      // 2. Navigate (with small delay to allow modal to close cleanly)
      setTimeout(() => {
         router.push({
          pathname: `/${route}/[puzzleId]`,
          params: { 
            puzzleId, 
            puzzleDate // Synchronous access check
          },
        } as never);
      }, 100);
    }
  }, [gameMode, puzzleId, puzzleDate, router, onClose]);

  /**
   * Handle "Go Premium" button press.
   */
  const handleGoPremium = useCallback(() => {
    onClose();
    setTimeout(() => {
      router.push({
        pathname: '/premium-modal',
        params: { puzzleDate, mode: 'blocked' },
      });
    }, 150);
  }, [onClose, router, puzzleDate]);

  /**
   * Handle "Watch Ad" button press.
   */
  const handleWatchAd = useCallback(async () => {
    setState('loading_ad');
    setErrorMessage(null);

    try {
      // Load the ad if not already loaded
      if (!isRewardedAdReady) {
        await loadRewardedAd();
      }

      // Show the ad
      setState('showing_ad');
      const rewarded = await showRewardedAd();

      if (rewarded) {
        // Grant the unlock
        await grantAdUnlock(puzzleId);

        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch { /* ignore */ }
        
        if (isMountedRef.current) {
          setState('ad_success');
        }
      } else {
        // User closed ad without completing
        if (isMountedRef.current) {
          setState('idle');
        }
      }
    } catch (error: unknown) {
      console.error('[UnlockChoiceModal] Ad error:', error);
      if (isMountedRef.current) {
        const message = error instanceof Error ? error.message : 'Failed to load ad. Please try again.';
        setErrorMessage(message);
        setState('ad_error');
      }
    }
  }, [isRewardedAdReady, loadRewardedAd, showRewardedAd, grantAdUnlock, puzzleId]);

  /**
   * Handle retry after ad error.
   */
  const handleRetry = useCallback(() => {
    setErrorMessage(null);
    handleWatchAd();
  }, [handleWatchAd]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      testID={testID}
    >
      <View style={styles.overlay}>
        <Animated.View
          entering={SlideInDown.springify().damping(15).stiffness(100)}
          style={styles.modal}
        >
          {/* Close Button - Always visible except when loading/showing ad or SUCCESS (handled by back link) */}
          {state !== 'loading_ad' && state !== 'showing_ad' && state !== 'ad_success' && (
            <Pressable
              style={styles.closeButton}
              onPress={onClose}
              hitSlop={12}
              testID={`${testID}-close`}
            >
              <X size={24} color={colors.textSecondary} />
            </Pressable>
          )}

          {/* Icon */}
          <View
            style={[
              styles.iconContainer,
              state === 'ad_success' && styles.iconContainerSuccess,
            ]}
          >
            {state === 'ad_success' ? (
              <Check size={32} color={colors.stadiumNavy} strokeWidth={3} />
            ) : (
              <Unlock size={32} color={colors.stadiumNavy} strokeWidth={2} />
            )}
          </View>

          {/* Title */}
          <Text style={styles.title}>
            {state === 'ad_success' ? 'PUZZLE UNLOCKED!' : 'UNLOCK PUZZLE'}
          </Text>

          {/* Subtitle */}
          <Text style={styles.subtitle}>
            {state === 'ad_success'
              ? 'This puzzle is now unlocked forever.'
              : 'Choose how you want to access this puzzle'}
          </Text>

          {/* Puzzle Date */}
          {state !== 'ad_success' && puzzleDate && (
            <Text style={styles.puzzleDate}>
              {formatPuzzleDate(puzzleDate)}
            </Text>
          )}

          {/* Content based on state */}
          {state === 'idle' && (
            <IdleContent
              onGoPremium={handleGoPremium}
              onWatchAd={handleWatchAd}
              isAdReady={isRewardedAdReady}
              testID={testID}
            />
          )}

          {(state === 'loading_ad' || state === 'showing_ad') && (
            <LoadingContent state={state} />
          )}

          {state === 'ad_success' && (
            <SuccessContent 
              onPlayNow={handlePlayNow} 
              onClose={onClose} 
              testID={testID} 
            />
          )}

          {state === 'ad_error' && (
            <ErrorContent
              message={errorMessage}
              onRetry={handleRetry}
              onClose={onClose}
              testID={testID}
            />
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

/**
 * Idle state content - shows two unlock options.
 */
function IdleContent({
  onGoPremium,
  onWatchAd,
  isAdReady,
  testID,
}: {
  onGoPremium: () => void;
  onWatchAd: () => void;
  isAdReady: boolean;
  testID?: string;
}) {
  return (
    <View style={styles.optionsContainer}>
      <View style={styles.optionCard}>
        <View style={styles.optionHeader}>
          <Crown size={24} color={colors.cardYellow} />
          <View style={styles.optionInfo}>
            <Text style={styles.optionTitle}>Go Pro</Text>
            <Text style={styles.optionSubtitle}>
              Unlimited access to all puzzles
            </Text>
          </View>
        </View>
        <ElevatedButton
          title="See Plans"
          onPress={onGoPremium}
          size="small"
          topColor={colors.cardYellow}
          shadowColor="#D4A500"
          testID={`${testID}-premium-button`}
        />
      </View>

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>OR</Text>
        <View style={styles.dividerLine} />
      </View>

      <View style={styles.optionCard}>
        <View style={styles.optionHeader}>
          <Play size={24} color={colors.pitchGreen} />
          <View style={styles.optionInfo}>
            <Text style={styles.optionTitle}>Watch Ad</Text>
            <Text style={styles.optionSubtitle}>
              Unlock this puzzle forever
            </Text>
          </View>
        </View>
        <ElevatedButton
          title={isAdReady ? 'Watch' : 'Loading...'}
          onPress={onWatchAd}
          size="small"
          topColor={isAdReady ? colors.pitchGreen : colors.glassBackground}
          shadowColor={isAdReady ? colors.grassShadow : colors.glassBorder}
          disabled={!isAdReady}
          testID={`${testID}-watch-ad-button`}
        />
      </View>

      <Text style={styles.freeLabel}>FREE</Text>
    </View>
  );
}

/**
 * Loading state content.
 */
function LoadingContent({ state }: { state: UnlockChoiceState }) {
  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      style={styles.loadingContainer}
    >
      <ActivityIndicator size="large" color={colors.pitchGreen} />
      <Text style={styles.loadingText}>
        {state === 'loading_ad' ? 'Loading ad...' : 'Playing ad...'}
      </Text>
    </Animated.View>
  );
}

/**
 * Success state content with MANUAL navigation controls.
 * Redesigned for a "gamified" look with prominent Play button.
 */
function SuccessContent({ 
  onPlayNow, 
  onClose,
  testID 
}: { 
  onPlayNow: () => void; 
  onClose: () => void;
  testID?: string;
}) {
  return (
    <Animated.View
      entering={FadeIn.duration(300).delay(100)}
      style={styles.successContainer}
    >
      <View style={styles.buttonContainer}>
        {/* Play Now Button - Primary Action - LARGE and FUN */}
        <ElevatedButton
          title="PLAY NOW"
          onPress={onPlayNow}
          size="large"
          topColor={colors.pitchGreen}
          shadowColor={colors.grassShadow}
          icon={<Play size={24} color={colors.stadiumNavy} fill={colors.stadiumNavy} />}
          testID={`${testID}-play-now-button`}
          style={{ width: '100%' }}
          textStyle={{ 
            fontSize: 20, 
            letterSpacing: 1.5,
            fontWeight: '800',
            fontFamily: fonts.headline // Ensure font matches game aesthetic
          }}
        />

        {/* Close/Archive Button - Secondary Action - Subtle but VISIBLE */}
        <Pressable 
          onPress={onClose}
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }
          ]}
          hitSlop={12}
          testID={`${testID}-success-close-button`}
        >
          <Text style={styles.secondaryButtonText}>Back to Archive</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

/**
 * Error state content.
 */
function ErrorContent({
  message,
  onRetry,
  onClose,
  testID,
}: {
  message: string | null;
  onRetry: () => void;
  onClose: () => void;
  testID?: string;
}) {
  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      style={styles.errorContainer}
    >
      <AlertCircle size={32} color={colors.redCard} />
      <Text style={styles.errorText}>
        {message || 'Something went wrong. Please try again.'}
      </Text>
      <View style={styles.buttonContainer}>
        <ElevatedButton
          title="Try Again"
          onPress={onRetry}
          size="medium"
          topColor={colors.pitchGreen}
          shadowColor={colors.grassShadow}
          testID={`${testID}-retry-button`}
        />
        <ElevatedButton
          title="Cancel"
          onPress={onClose}
          size="medium"
          topColor={colors.glassBackground}
          shadowColor={colors.glassBorder}
          testID={`${testID}-cancel-button`}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modal: {
    backgroundColor: colors.stadiumNavy,
    borderRadius: borderRadius['2xl'],
    borderWidth: 2,
    borderColor: colors.pitchGreen,
    padding: spacing.xl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    zIndex: 10,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.pitchGreen,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconContainerSuccess: {
    backgroundColor: colors.pitchGreen,
  },
  title: {
    fontFamily: fonts.headline,
    fontSize: 28,
    letterSpacing: 2,
    color: colors.pitchGreen,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...textStyles.body,
    color: colors.floodlightWhite,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  puzzleDate: {
    ...textStyles.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  // Options
  optionsContainer: {
    width: '100%',
    marginTop: spacing.md,
    gap: spacing.md,
  },
  optionCard: {
    backgroundColor: colors.glassBackground,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  optionInfo: {
    flex: 1,
  },
  optionTitle: {
    ...textStyles.body,
    color: colors.floodlightWhite,
    fontWeight: '600',
  },
  optionSubtitle: {
    ...textStyles.caption,
    color: colors.textSecondary,
  },
  freeLabel: {
    fontFamily: fonts.headline,
    fontSize: 10,
    letterSpacing: 1,
    color: colors.pitchGreen,
    textAlign: 'center',
    marginTop: -spacing.sm,
  },
  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.glassBorder,
  },
  dividerText: {
    ...textStyles.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  // Loading
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
  loadingText: {
    ...textStyles.body,
    color: colors.textSecondary,
  },
  // Success
  successContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.lg,
  },
  // Error
  errorContainer: {
    width: '100%',
    alignItems: 'center',
    gap: spacing.lg,
    paddingTop: spacing.md,
  },
  errorText: {
    ...textStyles.body,
    color: colors.redCard,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    gap: spacing.lg, // Increased gap for better separation
  },
  secondaryButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  secondaryButtonText: {
    ...textStyles.body,
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
    letterSpacing: 0.5,
  },
});
