import React from 'react';
import { View, Text, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Zap } from 'lucide-react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { HOME_FONTS } from '@/theme/home-design';
import { SpecialEvent } from '../../config/events';

const THEME_COLORS = {
  blue: {
    gradient: ['#1e293b', '#172554'] as [string, string],
    accent: '#3b82f6',
    glow: '#60A5FA',
    border: 'rgba(59, 130, 246, 0.3)',
    tagBg: 'rgba(59, 130, 246, 0.2)',
    shadow: '#1d4ed8',
  },
  red: {
    gradient: ['#1e293b', '#4a1525'] as [string, string],
    accent: '#ef4444',
    glow: '#f87171',
    border: 'rgba(239, 68, 68, 0.3)',
    tagBg: 'rgba(239, 68, 68, 0.2)',
    shadow: '#b91c1c',
  },
  gold: {
    gradient: ['#1e293b', '#422006'] as [string, string],
    accent: '#f59e0b',
    glow: '#fbbf24',
    border: 'rgba(245, 158, 11, 0.3)',
    tagBg: 'rgba(245, 158, 11, 0.2)',
    shadow: '#b45309',
  },
};

interface EventBannerProps {
  event: SpecialEvent;
  onPress: () => void;
}

export function EventBanner({ event, onPress }: EventBannerProps) {
  const theme = THEME_COLORS[event.theme] || THEME_COLORS.gold;

  return (
    <View style={styles.wrapper}>
      <Pressable onPress={onPress}>
        <LinearGradient
          colors={theme.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.container, { borderColor: theme.border }]}
        >
          <Svg style={styles.svgGlow} width="200" height="200" viewBox="0 0 200 200">
            <Defs>
              <RadialGradient
                id="glowGradient"
                cx="50%"
                cy="50%"
                rx="50%"
                ry="50%"
                fx="50%"
                fy="50%"
                gradientUnits="userSpaceOnUse"
              >
                <Stop offset="0" stopColor={theme.accent} stopOpacity="0.3" />
                <Stop offset="1" stopColor={theme.accent} stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Rect x="0" y="0" width="200" height="200" fill="url(#glowGradient)" />
          </Svg>

          {/* Tag */}
          <View style={[styles.tagContainer, { backgroundColor: theme.tagBg }]}>
            <Zap size={12} color={theme.glow} fill={theme.glow} />
            <Text style={[styles.tagText, { color: theme.glow }]}>{event.tag}</Text>
          </View>

          {/* Content */}
          <View style={styles.contentRow}>
            <View style={styles.textColumn}>
              <Text style={styles.title}>{event.title}</Text>
              <Text style={styles.subtitle}>{event.subtitle}</Text>
            </View>

            <View style={[styles.button, { backgroundColor: theme.accent, shadowColor: theme.shadow }]}>
              <Text style={styles.buttonText}>PLAY</Text>
            </View>
          </View>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 20,
    marginTop: 24,
    borderRadius: 16,
    overflow: 'hidden',
  },
  container: {
    padding: 16,
    borderWidth: 1,
  } as ViewStyle,
  svgGlow: {
    position: 'absolute',
    right: -50,
    top: -50,
    zIndex: -1,
  },
  tagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  tagText: {
    fontFamily: HOME_FONTS.body,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  contentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  textColumn: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontFamily: HOME_FONTS.heading,
    fontSize: 24,
    color: '#fff',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  subtitle: {
    fontFamily: HOME_FONTS.body,
    fontSize: 12,
    color: '#94a3b8',
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  buttonText: {
    fontFamily: HOME_FONTS.heading,
    color: '#fff',
    fontSize: 14,
    marginTop: 2,
  },
});
