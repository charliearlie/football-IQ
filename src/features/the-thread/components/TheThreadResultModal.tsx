/**
 * The Thread Game Result Modal
 *
 * Displays game results using the standard BaseResultModal pattern:
 * - "Share Result" + "Close" buttons
 * - Kit lore fun fact
 * - Score distribution
 * - Image-based sharing
 */

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  NativeSyntheticEvent,
  TextLayoutEventData,
} from "react-native";
import { Trophy, XCircle } from "lucide-react-native";
import {
  BaseResultModal,
  AnswerReveal,
  ResultShareCard,
} from "@/components/GameResultModal";
import type { ResultShareData } from "@/components/GameResultModal";
import { ScoreDistributionContainer } from "@/features/stats/components/ScoreDistributionContainer";
import { useAuth } from "@/features/auth";
import { colors, spacing, fonts, fontWeights } from "@/theme";
import { ThreadScore, generateThreadEmojiGrid } from "../utils/scoring";
import type { ThreadType, KitLore } from "../types/theThread.types";
import type { ShareResult } from "../hooks/useTheThreadGame";

interface TheThreadResultModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Whether the player won */
  won: boolean;
  /** Game score data */
  score: ThreadScore;
  /** The correct club name */
  correctClubName: string;
  /** Thread type for title display */
  threadType: ThreadType;
  /** Kit lore fun fact (revealed after game ends) */
  kitLore: KitLore | null;
  /** Puzzle ID for score distribution */
  puzzleId: string;
  /** Puzzle date in YYYY-MM-DD format */
  puzzleDate: string;
  /** Callback to share result */
  onShare: () => Promise<ShareResult>;
  /** Callback to close/dismiss the modal */
  onClose: () => void;
  /** Test ID for testing */
  testID?: string;
}

/**
 * The Thread game result modal with kit lore section.
 */
export function TheThreadResultModal({
  visible,
  won,
  score,
  correctClubName,
  threadType,
  kitLore,
  puzzleId,
  puzzleDate,
  onShare,
  onClose,
  testID,
}: TheThreadResultModalProps) {
  const { profile, totalIQ } = useAuth();

  // Generate score description for share card
  const scoreDescription = generateThreadEmojiGrid(score);

  // Check if perfect score (won with no hints)
  const isPerfectScore = won && score.hintsRevealed === 0;

  // Build share data for image capture
  const shareData: ResultShareData = {
    gameMode: "the_thread",
    scoreDisplay: scoreDescription,
    puzzleDate,
    displayName: profile?.display_name ?? "Football Fan",
    totalIQ,
    won,
    isPerfectScore,
  };

  // Share card content for image capture
  const shareCardContent = (
    <ResultShareCard
      gameMode="the_thread"
      resultType={won ? "win" : "loss"}
      scoreDisplay={scoreDescription}
      puzzleDate={puzzleDate}
      displayName={shareData.displayName}
      totalIQ={totalIQ}
      isPerfectScore={isPerfectScore}
    />
  );

  // Thread type label
  const threadTypeLabel =
    threadType === "sponsor" ? "Kit Sponsor" : "Kit Supplier";

  return (
    <BaseResultModal
      visible={visible}
      resultType={won ? "win" : "loss"}
      icon={
        won ? (
          <Trophy size={32} color={colors.stadiumNavy} strokeWidth={2} />
        ) : (
          <XCircle size={32} color={colors.floodlightWhite} strokeWidth={2} />
        )
      }
      title={won ? "CORRECT!" : "GAME OVER"}
      message={
        won
          ? score.hintsRevealed === 0
            ? "Solved with no hints!"
            : `Solved using ${score.hintsRevealed} hint${score.hintsRevealed > 1 ? "s" : ""}!`
          : "Better luck next time!"
      }
      onShare={onShare}
      shareCardContent={shareCardContent}
      shareData={shareData}
      onClose={onClose}
      testID={testID}
    >
      {/* Answer reveal for loss */}
      {!won && <AnswerReveal value={correctClubName} />}

      {/* Kit Lore Section */}
      {kitLore && <KitLoreSection kitLore={kitLore} />}

      {/* Score distribution */}
      <ScoreDistributionContainer
        puzzleId={puzzleId}
        gameMode="the_thread"
        userScore={score.points}
        maxSteps={score.maxPoints}
        testID={testID ? `${testID}-distribution` : undefined}
      />
    </BaseResultModal>
  );
}

const COLLAPSED_LINES = 2;

function KitLoreSection({ kitLore }: { kitLore: KitLore }) {
  const [expanded, setExpanded] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);

  const handleTextLayout = useCallback(
    (e: NativeSyntheticEvent<TextLayoutEventData>) => {
      setIsTruncated(e.nativeEvent.lines.length > COLLAPSED_LINES);
    },
    []
  );

  return (
    <View style={styles.kitLoreSection}>
      <Text style={styles.kitLoreLabel}>Kit Lore</Text>
      {/* Hidden full-render to measure line count */}
      <Text
        style={[styles.kitLoreFact, styles.hiddenMeasure]}
        onTextLayout={handleTextLayout}
      >
        {kitLore.fun_fact}
      </Text>
      <Text
        style={styles.kitLoreFact}
        numberOfLines={expanded ? undefined : COLLAPSED_LINES}
      >
        {kitLore.fun_fact}
      </Text>
      {isTruncated && (
        <Pressable onPress={() => setExpanded((v) => !v)}>
          <Text style={styles.seeMoreText}>
            {expanded ? "See less" : "See more"}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  kitLoreSection: {
    backgroundColor: colors.glassBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: spacing.md,
    marginBottom: spacing.lg,
    width: "100%",
  },
  kitLoreLabel: {
    fontFamily: fonts.headline,
    fontSize: 14,
    color: colors.cardYellow,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: spacing.xs,
  },
  kitLoreFact: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.regular,
    fontSize: 14,
    color: colors.floodlightWhite,
    lineHeight: 20,
  },
  hiddenMeasure: {
    position: "absolute",
    opacity: 0,
  },
  seeMoreText: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.semiBold,
    fontSize: 13,
    color: colors.cardYellow,
    marginTop: spacing.xs,
  },
});
