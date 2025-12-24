import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, textStyles, spacing } from '@/theme';
import { GlassCard } from '@/components';

const GAME_MODES = [
  {
    id: 'career-path',
    title: 'Career Path',
    description: 'Guess the player from sequential clues about their career',
  },
  {
    id: 'tic-tac-toe',
    title: 'Tic Tac Toe',
    description: 'Fill the 3x3 grid with players matching both categories',
  },
  {
    id: 'transfer-guess',
    title: 'Guess the Transfer',
    description: 'Identify the player from transfer information',
  },
  {
    id: 'goalscorers',
    title: 'Guess the Goalscorers',
    description: 'Name the scorers from a classic match result',
  },
  {
    id: 'topical-quiz',
    title: 'Topical Quiz',
    description: '10 multiple-choice questions on current football events',
  },
];

/**
 * Games Screen
 *
 * Lists all 5 game modes with descriptions.
 * Tapping a card navigates to the corresponding game screen.
 */
export default function GamesScreen() {
  const router = useRouter();

  const handleGamePress = (id: string) => {
    switch (id) {
      case 'career-path':
        router.push('/career-path');
        break;
      case 'transfer-guess':
        router.push('/transfer-guess');
        break;
      case 'goalscorers':
        router.push('/goalscorer-recall');
        break;
      // TODO: Add routes for other game modes
      default:
        // Game mode not yet implemented
        break;
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={[textStyles.h1, styles.title]}>Game Modes</Text>

      {GAME_MODES.map((mode) => (
        <Pressable
          key={mode.id}
          onPress={() => handleGamePress(mode.id)}
          style={({ pressed }) => [
            styles.cardPressable,
            pressed && styles.cardPressed,
          ]}
        >
          <GlassCard style={styles.card}>
            <Text style={[textStyles.subtitle, styles.cardTitle]}>
              {mode.title}
            </Text>
            <Text style={[textStyles.bodySmall, styles.cardDescription]}>
              {mode.description}
            </Text>
          </GlassCard>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.stadiumNavy,
  },
  content: {
    padding: spacing.xl,
    paddingBottom: spacing['3xl'],
  },
  title: {
    marginBottom: spacing.xl,
  },
  cardPressable: {
    marginBottom: spacing.lg,
  },
  cardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  card: {},
  cardTitle: {
    marginBottom: spacing.xs,
  },
  cardDescription: {
    opacity: 0.8,
  },
});
