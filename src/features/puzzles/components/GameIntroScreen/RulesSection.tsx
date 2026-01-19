/**
 * Rules Section Component
 *
 * Displays the game goal and bullet-point rules with staggered animations.
 * Highlights key terms in pitchGreen.
 */

import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { GameRules } from '../../constants/rules';
import { colors, textStyles, spacing, fonts, fontWeights } from '@/theme';

interface RulesSectionProps {
  /** Game rules containing goal and rule bullets */
  rules: GameRules;
  /** Test ID for testing */
  testID?: string;
}

/**
 * Rules section with staggered bullet point animations
 */
export function RulesSection({ rules, testID }: RulesSectionProps) {
  return (
    <View style={styles.container} testID={testID}>
      {/* Goal statement */}
      <Animated.Text
        entering={FadeInUp.delay(200).duration(400)}
        style={styles.goal}
      >
        {rules.goal}
      </Animated.Text>

      {/* Staggered rule bullets */}
      <View style={styles.bulletContainer}>
        {rules.rules.map((rule, index) => (
          <Animated.View
            key={index}
            entering={FadeInUp.delay(300 + index * 150).duration(400)}
            style={styles.bulletRow}
          >
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>
              {rule.highlight ? renderHighlightedText(rule.text, rule.highlight) : rule.text}
            </Text>
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

/**
 * Render text with a highlighted portion
 */
function renderHighlightedText(text: string, highlight: string) {
  const parts = text.split(highlight);

  if (parts.length === 1) {
    // Highlight not found, return plain text
    return text;
  }

  return (
    <>
      {parts[0]}
      <Text style={styles.highlight}>{highlight}</Text>
      {parts[1]}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
  },
  goal: {
    ...textStyles.subtitle,
    color: colors.floodlightWhite,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  bulletContainer: {
    gap: spacing.md,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.md,
  },
  bullet: {
    fontFamily: fonts.body,
    fontSize: 18,
    color: colors.pitchGreen,
    marginRight: spacing.sm,
    marginTop: 2,
  },
  bulletText: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.regular,
    fontSize: 16,
    lineHeight: 24,
    color: colors.floodlightWhite,
    flex: 1,
  },
  highlight: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.semiBold,
    color: colors.pitchGreen,
  },
});
