import React, { useEffect, useRef } from 'react';
import { StyleSheet, Image, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';
import { colors, fonts } from '@/theme';

interface AnimatedSplashProps {
  onComplete: () => void;
  ready: boolean;
  fontsReady?: boolean;
  nativeSplashHidden?: boolean;
}

// Minimum time the animated splash is visible after entrance begins.
// Measured from when nativeSplashHidden fires, not component mount.
const MIN_DISPLAY_MS = 1800;

// SVG canvas size for the radial glow behind the icon
const GLOW_SIZE = 280;

/**
 * AnimatedSplash — Premium staggered entrance for Football IQ.
 *
 * Trigger contract:
 *   - nativeSplashHidden=true  → kicks off entrance animations
 *   - fontsReady=true          → unlocks font families on text elements
 *   - ready=true               → triggers exit (respects MIN_DISPLAY_MS from entrance start)
 *
 * Animation timeline (all delays relative to nativeSplashHidden):
 *   0ms   Glow     opacity 0→0.4, scale 0.8→1.0 (800ms, cubic-out)
 *   0ms   Icon     spring scale pulse 1.0→1.05→settle
 *   300ms Title    opacity 0→1, translateY 30→0 (500ms, cubic-out)
 *   550ms Tagline  opacity 0→1, translateY 20→0 (400ms, cubic-out)
 *   700ms Accent   scaleX 0→1, opacity 0→0.6 (400ms, quad-out)
 *
 * Exit:
 *   Container scale 1→0.95 + opacity 1→0 (400ms, cubic-in) → onComplete
 */
export function AnimatedSplash({
  onComplete,
  ready,
  fontsReady = true,
  nativeSplashHidden = false,
}: AnimatedSplashProps) {
  // ─── Shared values ────────────────────────────────────────────────────────

  // Glow
  const glowOpacity = useSharedValue(0);
  const glowScale = useSharedValue(0.8);

  // Icon
  const iconScale = useSharedValue(1);

  // Title
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(30);

  // Tagline
  const taglineOpacity = useSharedValue(0);
  const taglineTranslateY = useSharedValue(20);

  // Accent line
  const accentScaleX = useSharedValue(0);
  const accentOpacity = useSharedValue(0);

  // Container (exit)
  const containerOpacity = useSharedValue(1);
  const containerScale = useSharedValue(1);

  // ─── Refs ─────────────────────────────────────────────────────────────────

  // Guards against double-firing either phase
  const entranceStarted = useRef(false);
  const exitStarted = useRef(false);

  // Timestamp of when entrance begins — used to enforce MIN_DISPLAY_MS
  const entranceTime = useRef<number | null>(null);

  // ─── Phase 1: Entrance ────────────────────────────────────────────────────

  useEffect(() => {
    if (!nativeSplashHidden || entranceStarted.current) return;
    entranceStarted.current = true;
    entranceTime.current = Date.now();

    // Glow — fade in and expand from centre
    glowOpacity.value = withTiming(0.4, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });
    glowScale.value = withTiming(1.0, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });

    // Icon — spring scale pulse (starts at 1 so feels like a heartbeat)
    iconScale.value = withSpring(1.05, { damping: 15, stiffness: 200 }, () => {
      iconScale.value = withSpring(1.0, { damping: 12, stiffness: 180 });
    });

    // Title — slides up and fades in at 300ms
    titleOpacity.value = withDelay(
      300,
      withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) }),
    );
    titleTranslateY.value = withDelay(
      300,
      withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) }),
    );

    // Tagline — slightly after title
    taglineOpacity.value = withDelay(
      550,
      withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) }),
    );
    taglineTranslateY.value = withDelay(
      550,
      withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) }),
    );

    // Accent line — last to appear, grows from centre
    accentScaleX.value = withDelay(
      700,
      withTiming(1, { duration: 400, easing: Easing.out(Easing.quad) }),
    );
    accentOpacity.value = withDelay(
      700,
      withTiming(0.6, { duration: 400, easing: Easing.out(Easing.quad) }),
    );
  }, [nativeSplashHidden]);

  // ─── Phase 2: Exit ────────────────────────────────────────────────────────

  useEffect(() => {
    if (!ready || exitStarted.current) return;
    exitStarted.current = true;

    // How long since entrance animations started
    const elapsed = entranceTime.current != null ? Date.now() - entranceTime.current : 0;
    const delay = Math.max(0, MIN_DISPLAY_MS - elapsed);

    const timer = setTimeout(() => {
      containerOpacity.value = withTiming(
        0,
        { duration: 400, easing: Easing.in(Easing.cubic) },
        () => { runOnJS(onComplete)(); },
      );
      containerScale.value = withTiming(0.95, {
        duration: 400,
        easing: Easing.in(Easing.cubic),
      });
    }, delay);

    return () => clearTimeout(timer);
  }, [ready]);

  // ─── Animated styles ──────────────────────────────────────────────────────

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
    transform: [{ scale: containerScale.value }],
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: glowScale.value }],
  }));

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const titleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const taglineAnimatedStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
    transform: [{ translateY: taglineTranslateY.value }],
  }));

  const accentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: accentOpacity.value,
    transform: [{ scaleX: accentScaleX.value }],
  }));

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <Animated.View style={[styles.container, containerAnimatedStyle]}>
      {/* Icon + glow layer */}
      <View style={styles.iconWrapper}>
        {/* Radial glow sits behind the icon, centred on it */}
        <Animated.View style={[styles.glowContainer, glowAnimatedStyle]}>
          <Svg width={GLOW_SIZE} height={GLOW_SIZE} viewBox={`0 0 ${GLOW_SIZE} ${GLOW_SIZE}`}>
            <Defs>
              <RadialGradient
                id="splashGlow"
                cx="50%"
                cy="50%"
                rx="50%"
                ry="50%"
                gradientUnits="userSpaceOnUse"
              >
                <Stop offset="0" stopColor={colors.pitchGreen} stopOpacity="0.55" />
                <Stop offset="0.5" stopColor={colors.pitchGreen} stopOpacity="0.15" />
                <Stop offset="1" stopColor={colors.pitchGreen} stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Circle
              cx={GLOW_SIZE / 2}
              cy={GLOW_SIZE / 2}
              r={GLOW_SIZE / 2}
              fill="url(#splashGlow)"
            />
          </Svg>
        </Animated.View>

        {/* App icon */}
        <Animated.View style={iconAnimatedStyle}>
          <Image
            source={require('../../assets/images/footballiq-icon2.png')}
            style={styles.icon}
            resizeMode="contain"
          />
        </Animated.View>
      </View>

      {/* Wordmark */}
      <Animated.Text
        style={[
          styles.title,
          titleAnimatedStyle,
          fontsReady && styles.titleFont,
        ]}
        allowFontScaling={false}
      >
        FOOTBALL IQ
      </Animated.Text>

      {/* Accent line — grows from centre via scaleX */}
      <Animated.View style={[styles.accentLine, accentAnimatedStyle]} />

      {/* Tagline */}
      <Animated.Text
        style={[
          styles.tagline,
          taglineAnimatedStyle,
          fontsReady && styles.taglineFont,
        ]}
        allowFontScaling={false}
      >
        TEST YOUR KNOWLEDGE
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.stadiumNavy,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },

  // ── Icon ──────────────────────────────────────────────────────────────────

  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    // The glow is absolutely positioned inside here, so we need a defined size
    width: GLOW_SIZE,
    height: GLOW_SIZE,
  },
  glowContainer: {
    position: 'absolute',
    width: GLOW_SIZE,
    height: GLOW_SIZE,
  },
  icon: {
    width: 120,
    height: 120,
    borderRadius: 24,
  },

  // ── Wordmark ──────────────────────────────────────────────────────────────

  title: {
    fontSize: 48,
    color: colors.floodlightWhite,
    letterSpacing: 6,
    // Fallback system font until fontsReady; style below overrides
    fontWeight: '700',
  },
  titleFont: {
    fontFamily: fonts.headline, // BebasNeue-Regular
    fontWeight: undefined,
  },

  // ── Accent line ───────────────────────────────────────────────────────────

  accentLine: {
    width: 60,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.pitchGreen,
    marginTop: 10,
    marginBottom: 12,
  },

  // ── Tagline ───────────────────────────────────────────────────────────────

  tagline: {
    fontSize: 14,
    color: colors.textSecondary,
    letterSpacing: 3,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  taglineFont: {
    fontFamily: fonts.body, // Inter
  },
});
