/**
 * Result Modal component for Goalscorer Recall.
 *
 * Shows the result with distribution graph highlighting user's score
 * and supports image-based sharing.
 */

import * as Clipboard from 'expo-clipboard';
import { Trophy, Clock } from 'lucide-react-native';
import { BaseResultModal, ResultShareCard } from '@/components/GameResultModal';
import type { ShareResult, ResultShareData } from '@/components/GameResultModal';
import { ScoreDistributionContainer } from '@/features/stats/components/ScoreDistributionContainer';
import { useAuth } from '@/features/auth';
import { colors } from '@/theme';
import type { GoalscorerRecallScore, GoalWithState } from '../types/goalscorerRecall.types';
import { generateGoalscorerShareText } from '../utils/share';
import { generateGoalscorerEmojiGrid } from '../utils/scoreDisplay';
import { getScoreMessage } from '../utils/scoring';

interface RecallResultModalProps {
  visible: boolean;
  score: GoalscorerRecallScore | null;
  goals: GoalWithState[];
  matchInfo: {
    homeTeam: string;
    awayTeam: string;
    homeScore: number;
    awayScore: number;
    competition: string;
    matchDate: string;
  };
  puzzleDate: string;
  puzzleId: string;
  onContinue: () => void;
}

export function RecallResultModal({
  visible,
  score,
  goals,
  matchInfo,
  puzzleDate,
  puzzleId,
  onContinue,
}: RecallResultModalProps) {
  const { profile, totalIQ } = useAuth();

  // Don't render if not visible or score not ready
  if (!visible || !score) return null;

  const handleShare = async (): Promise<ShareResult> => {
    const shareText = generateGoalscorerShareText(score, goals, matchInfo, puzzleDate);
    await Clipboard.setStringAsync(shareText);
    return { success: true, method: 'clipboard' };
  };

  // Generate emoji grid for share card
  const emojiGrid = generateGoalscorerEmojiGrid(goals);

  // Perfect score: all scorers found
  const isPerfectScore = score.won && score.scorersFound === score.totalScorers;

  // Build share data for image capture
  const shareData: ResultShareData = {
    gameMode: 'guess_the_goalscorers',
    scoreDisplay: emojiGrid,
    puzzleDate,
    displayName: profile?.display_name ?? 'Football Fan',
    totalIQ,
    won: score.won,
    isPerfectScore,
  };

  // Share card content for image capture
  const shareCardContent = (
    <ResultShareCard
      gameMode="guess_the_goalscorers"
      resultType={score.won ? 'win' : 'loss'}
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
      resultType={score.won ? 'win' : 'loss'}
      icon={
        score.won ? (
          <Trophy size={32} color={colors.stadiumNavy} strokeWidth={2} />
        ) : (
          <Clock size={32} color={colors.floodlightWhite} strokeWidth={2} />
        )
      }
      title={score.won ? 'ALL FOUND!' : 'TIME UP!'}
      message={getScoreMessage(score)}
      onShare={handleShare}
      shareCardContent={shareCardContent}
      shareData={shareData}
      onClose={onContinue}
      closeLabel="Continue"
      showConfetti={score.won}
    >
      {/* Distribution graph - highlights user's score position */}
      <ScoreDistributionContainer
        puzzleId={puzzleId}
        gameMode="guess_the_goalscorers"
        userScore={score.scorersFound}
        maxSteps={score.totalScorers}
      />
    </BaseResultModal>
  );
}
