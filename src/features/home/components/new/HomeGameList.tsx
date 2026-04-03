import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CheckCircle } from 'lucide-react-native';
import { GlassGameCard } from './GlassGameCard';
import { DailyPuzzleCard } from '@/features/home/hooks/useDailyPuzzles';
import { HOME_COLORS, HOME_FONTS } from '@/theme/home-design';

// Map game modes to display titles/subtitles
// This duplicates some logic from UniversalGameCard but allows for redesign specific text
const GAME_METADATA: Record<string, { title: string; subtitle: string }> = {
  career_path: { title: 'CAREER PATH', subtitle: 'Follow the journey' },
  career_path_pro: { title: 'CAREER PATH PRO', subtitle: 'For true experts' },
  guess_the_transfer: { title: 'TRANSFER GUESS', subtitle: 'Who made the move?' },
  guess_the_goalscorers: { title: 'GOALSCORER RECALL', subtitle: 'Remember the match' },
  topical_quiz: { title: 'QUIZ', subtitle: '5 questions' },
  starting_xi: { title: 'STARTING XI', subtitle: 'Name the lineup' },
  top_tens: { title: 'TOP TENS', subtitle: 'Name all 10' },
  the_grid: { title: 'THE GRID', subtitle: 'Fill the matrix' },
  the_chain: { title: 'THE CHAIN', subtitle: 'Link the players' },
  the_thread: { title: 'THREADS', subtitle: 'Follow the thread' },
  connections: { title: 'CONNECTIONS', subtitle: 'Find the groups' },
  timeline: { title: 'TIMELINE', subtitle: 'Order the career' },
  who_am_i: { title: 'WHO AM I?', subtitle: 'Guess the player' },
  higher_lower: { title: 'HIGHER/LOWER', subtitle: 'Compare the fees' },
  balldle: { title: 'BALLDLE', subtitle: 'Guess the player' },
};

function getTimeToMidnight(): string {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const diff = midnight.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
}

function DailyCompleteCard() {
  const [countdown, setCountdown] = useState(getTimeToMidnight);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(getTimeToMidnight());
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={completeStyles.container}>
      <CheckCircle size={48} color={HOME_COLORS.pitchGreen} />
      <Text style={completeStyles.title}>ALL DONE FOR TODAY</Text>
      <Text style={completeStyles.subtitle}>Your streak is safe</Text>
      <Text style={completeStyles.countdown}>Next games in {countdown}</Text>
    </View>
  );
}

const completeStyles = StyleSheet.create({
  container: {
    backgroundColor: HOME_COLORS.surface,
    borderWidth: 1,
    borderColor: HOME_COLORS.glassBorder,
    borderRadius: 16,
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  title: {
    fontFamily: HOME_FONTS.heading,
    fontSize: 24,
    color: HOME_COLORS.pitchGreen,
    marginTop: 12,
    letterSpacing: 1,
  },
  subtitle: {
    fontFamily: HOME_FONTS.body,
    fontSize: 14,
    color: HOME_COLORS.textSecondary,
    marginTop: 4,
  },
  countdown: {
    fontFamily: HOME_FONTS.stats,
    fontSize: 13,
    color: HOME_COLORS.textSecondary,
    marginTop: 8,
  },
});

interface HomeGameListProps {
  cards: DailyPuzzleCard[];
  onCardPress: (card: DailyPuzzleCard) => void;
  onWatchAd: (card: DailyPuzzleCard) => void;
  onGoPro: () => void;
  isPremium: boolean;
}

export function HomeGameList({
  cards,
  onCardPress,
  onWatchAd,
  onGoPro,
  isPremium,
}: HomeGameListProps) {
  const playableCards = cards.filter((card) => isPremium || !card.isPremiumOnly || card.isAdUnlocked);
  const allDone = playableCards.length > 0 && playableCards.every((card) => card.status === 'done');

  return (
    <View style={styles.container}>
      {allDone && <DailyCompleteCard />}
      {cards.map((card) => {
        const meta = GAME_METADATA[card.gameMode] || { title: 'UNKNOWN', subtitle: '' };

        return (
          <GlassGameCard
            key={card.puzzleId}
            gameMode={card.gameMode}
            status={card.status}
            title={meta.title}
            subtitle={meta.subtitle}
            onPress={() => onCardPress(card)}
            isPremiumOnly={card.isPremiumOnly}
            isPremium={isPremium}
            isAdUnlocked={card.isAdUnlocked}
            onWatchAd={() => onWatchAd(card)}
            onGoPro={onGoPro}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 0,
    paddingBottom: 40,
  },
});
