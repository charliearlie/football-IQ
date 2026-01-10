import { View, StyleSheet } from 'react-native';
import { ElevatedButton } from '@/components/ElevatedButton';
import { colors, spacing } from '@/theme';

export interface ReviewModeActionZoneProps {
  /** Callback when the close button is pressed */
  onClose: () => void;
  /** Button label (default: "Close Review") */
  label?: string;
  /** Test ID for testing */
  testID?: string;
}

/**
 * ReviewModeActionZone - Action zone for review mode
 *
 * Replaces the normal game input/action zone when in review mode.
 * Shows a single "Close Review" button that navigates back.
 */
export function ReviewModeActionZone({
  onClose,
  label = 'Close Review',
  testID,
}: ReviewModeActionZoneProps) {
  return (
    <View style={styles.container} testID={testID}>
      <ElevatedButton
        title={label}
        onPress={onClose}
        size="large"
        topColor={colors.floodlightWhite}
        shadowColor={colors.textSecondary}
        fullWidth
        testID="close-review-button"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    backgroundColor: colors.stadiumNavy,
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
  },
});
