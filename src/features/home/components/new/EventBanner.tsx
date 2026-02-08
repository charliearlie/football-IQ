import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Zap } from 'lucide-react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { HOME_COLORS, HOME_FONTS } from '@/theme/home-design';
import { SpecialEvent } from '../../config/events';

interface EventBannerProps {
  event: SpecialEvent;
  onPress: () => void;
}

export function EventBanner({ event, onPress }: EventBannerProps) {
  return (
    <View style={styles.wrapper}>
      <Pressable onPress={onPress}>
        <LinearGradient
          colors={['#1e293b', '#172554']} // Standard Blue/Navy gradient
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.container}
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
                <Stop offset="0" stopColor="#3b82f6" stopOpacity="0.3" />
                <Stop offset="1" stopColor="#3b82f6" stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Rect x="0" y="0" width="200" height="200" fill="url(#glowGradient)" />
          </Svg>

          {/* Tag */}
          <View style={styles.tagContainer}>
            <Zap size={12} color="#60A5FA" fill="#60A5FA" />
            <Text style={styles.tagText}>{event.tag}</Text>
          </View>

          {/* Content */}
          <View style={styles.contentRow}>
            <View style={styles.textColumn}>
              <Text style={styles.title}>{event.title}</Text>
              <Text style={styles.subtitle}>{event.subtitle}</Text>
            </View>

            <View style={styles.button}>
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
    overflow: 'hidden', // Contain the glow
  },
  container: {
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
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
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
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
    color: '#60A5FA',
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
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: '#1d4ed8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0, // Solid shadow for 3D effect
    elevation: 4,
  },
  buttonText: {
    fontFamily: HOME_FONTS.heading,
    color: '#fff',
    fontSize: 14,
    marginTop: 2,
  }
});
