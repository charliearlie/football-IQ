import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from '@/theme';

export interface AuthLoadingScreenProps {
  testID?: string;
}

/**
 * AuthLoadingScreen - Loading indicator during auth initialization
 *
 * Displays a centered ActivityIndicator with pitchGreen color
 * on a stadiumNavy background while the auth state is being established.
 */
export function AuthLoadingScreen({ testID }: AuthLoadingScreenProps) {
  return (
    <View style={styles.container} testID={testID}>
      <ActivityIndicator size="large" color={colors.pitchGreen} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.stadiumNavy,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
