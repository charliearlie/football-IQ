import { View, Text, StyleSheet } from 'react-native';
import { Link, Stack } from 'expo-router';
import { colors, textStyles } from '@/theme';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={styles.container}>
        <Text style={[textStyles.h1, styles.title]}>Page Not Found</Text>
        <Text style={[textStyles.body, styles.message]}>
          This screen doesn't exist.
        </Text>
        <Link href="/" style={styles.link}>
          <Text style={[textStyles.subtitle, styles.linkText]}>
            Go to home screen
          </Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: colors.stadiumNavy,
  },
  title: {
    marginBottom: 16,
  },
  message: {
    marginBottom: 24,
    textAlign: 'center',
  },
  link: {
    paddingVertical: 12,
  },
  linkText: {
    color: colors.pitchGreen,
  },
});
