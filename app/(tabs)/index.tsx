import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, textStyles, spacing } from '@/theme';
import { ElevatedButton, GlassCard } from '@/components';

/**
 * Home Screen
 *
 * Main landing screen showing today's puzzles and quick actions.
 */
export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={[textStyles.h1, styles.title]}>Football IQ</Text>
      <Text style={[textStyles.body, styles.subtitle]}>
        Test your football knowledge daily
      </Text>

      <GlassCard style={styles.card}>
        <Text style={[textStyles.subtitle, styles.cardTitle]}>
          Today's Challenge
        </Text>
        <Text style={[textStyles.bodySmall, styles.cardText]}>
          5 game modes await. How well do you know the beautiful game?
        </Text>
      </GlassCard>

      <View style={styles.actions}>
        <ElevatedButton
          title="Play Now"
          onPress={() => {}}
          size="large"
        />

        <ElevatedButton
          title="Design Lab"
          onPress={() => router.push('/design-lab')}
          topColor={colors.cardYellow}
          shadowColor="#D4A500"
          size="medium"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.xl,
    backgroundColor: colors.stadiumNavy,
  },
  title: {
    marginTop: spacing['2xl'],
  },
  subtitle: {
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  card: {
    marginBottom: spacing.xl,
  },
  cardTitle: {
    marginBottom: spacing.sm,
  },
  cardText: {
    opacity: 0.8,
  },
  actions: {
    gap: spacing.lg,
    alignItems: 'flex-start',
  },
});
