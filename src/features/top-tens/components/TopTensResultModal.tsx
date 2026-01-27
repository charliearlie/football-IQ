/**
 * Top Tens Game Result Modal
 *
 * Displays game results using the shared BaseResultModal component
 * with image-based sharing.
 */

import { Trophy, XCircle } from 'lucide-react-native';
import {
  BaseResultModal,
  ScoreDisplay,
  ResultShareCard,
} from '@/components/GameResultModal';
import type { ResultShareData } from '@/components/GameResultModal';
import { ScoreDistributionContainer } from '@/features/stats/components/ScoreDistributionContainer';
import { useAuth } from '@/features/auth';
import { colors } from '@/theme/colors';
import { TopTensScore, RankSlotState } from '../types/topTens.types';
import { ShareResult } from '../utils/share';
import { generateTopTensEmojiGrid } from '../utils/scoreDisplay';

interface TopTensResultModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Whether the player won (found all 10) */
  won: boolean;
  /** Game score data */
  score: TopTensScore;
  /** Array of rank slot states for emoji grid */
  rankSlots: RankSlotState[];
  /** Puzzle ID for score distribution */
  puzzleId: string;
  /** Puzzle date in YYYY-MM-DD format */
  puzzleDate: string;
  /** Callback to share result (legacy fallback) */
  onShare: () => Promise<ShareResult>;
  /** Callback to close/dismiss the modal */
  onClose: () => void;
  /** Test ID for testing */
  testID?: string;
}

/**
 * Top Tens game result modal with win/loss display and image-based sharing.
 *
 * Win: Shows trophy, "ALL FOUND!", score, and confetti
 * Loss: Shows X, "GAME OVER", score (partial)
 */
export function TopTensResultModal({
  visible,
  won,
  score,
  rankSlots,
  puzzleId,
  puzzleDate,
  onShare,
  onClose,
  testID,
}: TopTensResultModalProps) {
  const { profile, totalIQ } = useAuth();

  // Generate emoji grid for share card
  const emojiGrid = generateTopTensEmojiGrid(rankSlots, score);

  // Perfect score: all 10 found
  const isPerfectScore = won && score.foundCount === 10;

  // Build share data for image capture
  const shareData: ResultShareData = {
    gameMode: 'top_tens',
    scoreDisplay: emojiGrid,
    puzzleDate,
    displayName: profile?.display_name ?? 'Football Fan',
    totalIQ,
    won,
    isPerfectScore,
  };

  // Share card content for image capture
  const shareCardContent = (
    <ResultShareCard
      gameMode="top_tens"
      resultType={won ? 'win' : 'loss'}
      scoreDisplay={emojiGrid}
      puzzleDate={puzzleDate}
      displayName={shareData.displayName}
      totalIQ={totalIQ}
      isPerfectScore={isPerfectScore}
    />
  );

  return (
    <BaseResultModal
      visible={visible}
      resultType={won ? 'win' : 'loss'}
      icon={
        won ? (
          <Trophy size={32} color={colors.stadiumNavy} strokeWidth={2} />
        ) : (
          <XCircle size={32} color={colors.floodlightWhite} strokeWidth={2} />
        )
      }
      title={won ? 'ALL FOUND!' : 'GAME OVER'}
      message={
        won
          ? `Perfect score with ${score.wrongGuessCount} wrong guess${score.wrongGuessCount !== 1 ? 'es' : ''}!`
          : `You found ${score.foundCount} out of 10`
      }
      onShare={onShare}
      shareCardContent={shareCardContent}
      shareData={shareData}
      onClose={onClose}
      testID={testID}
    >
      <ScoreDisplay value={`${score.points}/${score.maxPoints}`} />
      <ScoreDistributionContainer
        puzzleId={puzzleId}
        gameMode="top_tens"
        userScore={Math.round((score.points / 8) * 100)}
        testID={testID ? `${testID}-distribution` : undefined}
      />
    </BaseResultModal>
  );
}
