/**
 * Top Tens Game Result Modal
 *
 * Displays game results using the shared BaseResultModal component.
 */

import { Trophy, XCircle } from 'lucide-react-native';
import {
  BaseResultModal,
  ScoreDisplay,
} from '@/components/GameResultModal';
import { colors } from '@/theme/colors';
import { TopTensScore, RankSlotState } from '../types/topTens.types';
import { generateTopTensEmojiGrid } from '../utils/scoreDisplay';
import { ShareResult } from '../utils/share';

interface TopTensResultModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Whether the player won (found all 10) */
  won: boolean;
  /** Game score data */
  score: TopTensScore;
  /** Array of rank slot states for emoji grid */
  rankSlots: RankSlotState[];
  /** Callback to share result */
  onShare: () => Promise<ShareResult>;
  /** Callback to close/dismiss the modal */
  onClose: () => void;
  /** Test ID for testing */
  testID?: string;
}

/**
 * Top Tens game result modal with win/loss display.
 *
 * Win: Shows trophy, "ALL FOUND!", score, and confetti
 * Loss: Shows X, "GAME OVER", score (partial)
 */
export function TopTensResultModal({
  visible,
  won,
  score,
  rankSlots,
  onShare,
  onClose,
  testID,
}: TopTensResultModalProps) {
  const emojiGrid = generateTopTensEmojiGrid(rankSlots, score);

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
      emojiGrid={emojiGrid}
      message={
        won
          ? `Perfect score with ${score.wrongGuessCount} wrong guess${score.wrongGuessCount !== 1 ? 'es' : ''}!`
          : `You found ${score.foundCount} out of 10`
      }
      onShare={onShare}
      onClose={onClose}
      testID={testID}
    >
      <ScoreDisplay value={`${score.points}/${score.maxPoints}`} />
    </BaseResultModal>
  );
}
