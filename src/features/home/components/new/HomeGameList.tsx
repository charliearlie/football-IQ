import React from 'react';
import { View, StyleSheet } from 'react-native';
import { GlassGameCard } from './GlassGameCard';
import { DailyPuzzleCard } from '@/features/home/hooks/useDailyPuzzles';
import { GameMode } from '@/features/puzzles/types/puzzle.types';

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
};

interface HomeGameListProps {
  cards: DailyPuzzleCard[];
  onCardPress: (card: DailyPuzzleCard) => void;
  onWatchAd: (card: DailyPuzzleCard) => void;
  onGoPro: () => void;
  isPremium: boolean;
}

export function HomeGameList({ cards, onCardPress, onWatchAd, onGoPro, isPremium }: HomeGameListProps) {
  return (
    <View style={styles.container}>
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
