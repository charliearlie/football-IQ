/**
 * Result Modal component for Goalscorer Recall.
 *
 * Shows the result with distribution graph highlighting user's score.
 */

import * as Clipboard from 'expo-clipboard';
import { Trophy, Clock } from 'lucide-react-native';
import { BaseResultModal } from '@/components/GameResultModal';
import type { ShareResult } from '@/components/GameResultModal';
import { ScoreDistributionContainer } from '@/features/stats/components/ScoreDistributionContainer';
import { colors } from '@/theme';
import type { GoalscorerRecallScore, GoalWithState } from '../types/goalscorerRecall.types';
import { generateGoalscorerShareText } from '../utils/share';
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
  // Don't render if not visible or score not ready
  if (!visible || !score) return null;

  const handleShare = async (): Promise<ShareResult> => {
    const shareText = generateGoalscorerShareText(score, goals, matchInfo, puzzleDate);
    await Clipboard.setStringAsync(shareText);
    return { success: true, method: 'clipboard' };
  };

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
      onClose={onContinue}
      closeLabel="Continue"
      showConfetti={score.won}
    >
      {/* Distribution graph - highlights user's score position */}
      <ScoreDistributionContainer
        puzzleId={puzzleId}
        gameMode="guess_the_goalscorers"
        userScore={score.points}
        maxSteps={score.totalScorers}
      />
    </BaseResultModal>
  );
}
