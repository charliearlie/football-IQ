import { View, Text, StyleSheet } from 'react-native';
import { Eye } from 'lucide-react-native';
import { colors, spacing, fonts } from '@/theme';

export interface ReviewModeBannerProps {
  /** Test ID for testing */
  testID?: string;
}

/**
 * ReviewModeBanner - Displays "REVIEWING COMPLETED GAME" banner
 *
 * Used at the top of all game screens when in review mode.
 * Stadium Navy background with Pitch Green text.
 */
export function ReviewModeBanner({ testID }: ReviewModeBannerProps) {
  return (
    <View style={styles.container} testID={testID}>
      <Eye size={16} color={colors.pitchGreen} strokeWidth={2} />
      <Text style={styles.text}>REVIEWING COMPLETED GAME</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: colors.stadiumNavy,
    borderBottomWidth: 1,
    borderBottomColor: colors.pitchGreen,
  },
  text: {
    fontFamily: fonts.headline,
    fontSize: 14,
    color: colors.pitchGreen,
    letterSpacing: 1,
  },
});
