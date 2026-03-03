import { View, StyleSheet } from 'react-native';
import { Lock } from 'lucide-react-native';
import { borderRadius } from '@/theme';

export interface LockedCardProps {
  /** The step number to display */
  stepNumber: number;
  /** Test ID for testing */
  testID?: string;
}

/**
 * LockedCard - A minimal dashed-border locked card (V2).
 *
 * Renders a near-invisible placeholder with a faint lock icon,
 * indicating the step hasn't been revealed yet.
 * stepNumber is kept in props for API compatibility.
 */
export function LockedCard({ testID }: LockedCardProps) {
  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.lockOverlay}>
        <Lock size={16} color="rgba(255, 255, 255, 0.2)" strokeWidth={2} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 80,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.05)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockOverlay: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
