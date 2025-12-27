import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import Animated, { FadeIn, SlideInRight } from 'react-native-reanimated';
import { GlassCard } from '@/components';
import { colors, textStyles, spacing } from '@/theme';

interface QuizQuestionCardProps {
  /** The question text */
  question: string;
  /** Optional image URL */
  imageUrl?: string;
  /** Question number (1-5) */
  questionNumber: number;
  /** Unique key for animation */
  animationKey: string;
  /** Test ID for testing */
  testID?: string;
}

/**
 * Question card showing optional image and question text.
 *
 * - Image loads with skeleton placeholder
 * - Question text uses Bebas Neue for impact
 * - Animates in from right on question change
 */
export function QuizQuestionCard({
  question,
  imageUrl,
  questionNumber,
  animationKey,
  testID,
}: QuizQuestionCardProps) {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const hasImage = imageUrl && !imageError;

  return (
    <Animated.View
      key={animationKey}
      entering={SlideInRight.springify().damping(15)}
      testID={testID}
    >
      <GlassCard style={styles.card}>
        {/* Image container (if image exists) */}
        {hasImage && (
          <View style={styles.imageContainer}>
            {imageLoading && (
              <View style={styles.imageSkeleton}>
                <ActivityIndicator color={colors.pitchGreen} size="large" />
              </View>
            )}
            <Image
              source={{ uri: imageUrl }}
              style={styles.image}
              contentFit="cover"
              onLoadStart={() => setImageLoading(true)}
              onLoad={() => setImageLoading(false)}
              onError={() => {
                setImageLoading(false);
                setImageError(true);
              }}
              transition={200}
              testID={testID ? `${testID}-image` : undefined}
            />
          </View>
        )}

        {/* Question text */}
        <View style={styles.textContainer}>
          <Text style={styles.questionNumber}>Question {questionNumber}</Text>
          <Text style={styles.questionText}>{question}</Text>
        </View>
      </GlassCard>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 0,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    position: 'relative',
  },
  imageSkeleton: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    padding: spacing.lg,
  },
  questionNumber: {
    ...textStyles.caption,
    color: colors.cardYellow,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  questionText: {
    fontFamily: 'BebasNeue',
    fontSize: 24,
    color: colors.floodlightWhite,
    lineHeight: 28,
  },
});
