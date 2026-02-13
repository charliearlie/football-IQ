/**
 * TheChainResultModal - Result display for The Chain game
 *
 * Shows the final score with golf-style label and par comparison.
 * Uses BaseResultModal for consistent styling and share functionality.
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Trophy, Star, Skull, Flag, Bird } from "lucide-react-native";
import {
  BaseResultModal,
  ResultShareCard,
  ResultShareData,
} from "@/components/GameResultModal";
import { ScoreDistributionContainer } from "@/features/stats/components/ScoreDistributionContainer";
import { useAuth } from "@/features/auth";
import { colors, fonts, spacing } from "@/theme";
import { ChainScore, getChainScoreEmoji } from "../utils/scoring";
import { ChainLink } from "../types/theChain.types";
import { ShareResult } from "../utils/share";

export interface TheChainResultModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Score data */
  score: ChainScore | null;
  /** Chain of links */
  chain: ChainLink[];
  /** Puzzle ID for score distribution */
  puzzleId: string;
  /** Puzzle date for sharing */
  puzzleDate?: string;
  /** PAR value */
  par: number;
  /** Whether player gave up */
  gaveUp?: boolean;
  /** Callback when modal closes */
  onClose: () => void;
  /** Callback to share result */
  onShare: () => Promise<ShareResult>;
  /** Test ID for testing */
  testID?: string;
}

/**
 * Get icon based on score label.
 */
function getResultIcon(score: ChainScore | null, gaveUp?: boolean): React.ReactNode {
  if (gaveUp || !score?.completed) {
    return <Skull size={40} color={colors.redCard} />;
  }

  switch (score.label) {
    case "Eagle":
      return <Trophy size={40} color={colors.cardYellow} />;
    case "Birdie":
      return <Bird size={40} color={colors.pitchGreen} />;
    case "Par":
      return <Flag size={40} color={colors.pitchGreen} />;
    default:
      return <Star size={40} color={colors.textSecondary} />;
  }
}

/**
 * Get title text based on score label.
 */
function getResultTitle(score: ChainScore | null, gaveUp?: boolean): string {
  if (gaveUp) return "GAVE UP";
  if (!score?.completed) return "DID NOT FINISH";

  switch (score.label) {
    case "Eagle":
      return "EAGLE!";
    case "Birdie":
      return "BIRDIE!";
    case "Par":
      return "PAR!";
    case "Bogey":
      return "BOGEY";
    case "Double Bogey":
      return "DOUBLE BOGEY";
    case "Triple Bogey+":
      return "TRIPLE BOGEY+";
    default:
      return "COMPLETE";
  }
}

/**
 * Get result type for BaseResultModal styling.
 */
function getResultType(
  score: ChainScore | null,
  gaveUp?: boolean
): "win" | "loss" | "complete" {
  if (gaveUp || !score?.completed) return "loss";
  if (score.parDifference <= 0) return "win";
  return "complete";
}

/**
 * Get message based on score.
 */
function getResultMessage(score: ChainScore | null, gaveUp?: boolean): string {
  if (gaveUp) return "Better luck next time!";
  if (!score?.completed) return "The chain remains broken.";

  switch (score.label) {
    case "Eagle":
      return "Outstanding! A true link master!";
    case "Birdie":
      return "Excellent work! Under par!";
    case "Par":
      return "Well played! Right on target.";
    case "Bogey":
      return "Not bad, but there's room to improve.";
    case "Double Bogey":
      return "You got there in the end.";
    case "Triple Bogey+":
      return "A long journey, but you made it.";
    default:
      return "Chain complete!";
  }
}

export function TheChainResultModal({
  visible,
  score,
  chain,
  puzzleId,
  puzzleDate,
  par,
  gaveUp,
  onClose,
  onShare,
  testID,
}: TheChainResultModalProps) {
  const { profile, totalIQ } = useAuth();

  if (!score) return null;

  const resultType = getResultType(score, gaveUp);
  const icon = getResultIcon(score, gaveUp);
  const title = getResultTitle(score, gaveUp);
  const message = getResultMessage(score, gaveUp);
  const emoji = getChainScoreEmoji(score);

  // Generate score display text
  const scoreDisplayText = score.completed
    ? `${score.stepsTaken} steps (Par ${par})`
    : "DNF";

  // Par difference display
  const parDiffText = score.completed
    ? score.parDifference === 0
      ? "E"
      : score.parDifference > 0
        ? `+${score.parDifference}`
        : `${score.parDifference}`
    : "-";

  // Share data
  const shareData: ResultShareData = {
    gameMode: "the_chain",
    scoreDisplay: `${emoji} ${score.stepsTaken} steps (${parDiffText})`,
    puzzleDate: puzzleDate ?? '',
    displayName: profile?.display_name ?? 'Football Fan',
    totalIQ,
    won: score.parDifference <= 0,
    isPerfectScore: score.label === "Eagle",
  };

  // Map resultType to ResultShareType for share card
  const shareResultType = resultType === 'win' && score.label === 'Eagle'
    ? 'perfect' as const
    : resultType === 'win'
      ? 'win' as const
      : resultType === 'loss'
        ? 'loss' as const
        : 'complete' as const;

  const shareCardContent = (
    <ResultShareCard
      resultType={shareResultType}
      {...shareData}
    />
  );

  return (
    <BaseResultModal
      visible={visible}
      resultType={resultType}
      icon={null}
      title={title}
      message={message}
      onShare={onShare}
      shareCardContent={shareCardContent}
      shareData={shareData}
      onClose={onClose}
      showConfetti={false}
      testID={testID}
    >
      <View style={styles.content}>
        {/* Compact score display */}
        <View style={styles.scoreHeader}>
          <Text style={styles.stepsText}>{score.stepsTaken} STEPS</Text>
          <Text style={styles.parText}>
            Par {par} ({parDiffText})
          </Text>
        </View>

        {/* Score distribution */}
        <ScoreDistributionContainer
          puzzleId={puzzleId}
          gameMode="the_chain"
          userScore={score.stepsTaken}
        />
      </View>
    </BaseResultModal>
  );
}

const styles = StyleSheet.create({
  content: {
    width: "100%",
    gap: spacing.sm,
  },
  scoreHeader: {
    alignItems: "center",
    paddingVertical: spacing.xs,
  },
  stepsText: {
    fontFamily: fonts.headline,
    fontSize: 24,
    color: colors.floodlightWhite,
  },
  parText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
  },
});
