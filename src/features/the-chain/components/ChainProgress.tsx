/**
 * ChainProgress - Enhanced chain visualization for The Chain
 *
 * Displays the complete chain from start player to end player,
 * with gamified styling, animations, and clear visual hierarchy.
 */

import React, { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
} from "react-native-reanimated";
import { Link, Sparkles } from "lucide-react-native";
import { colors, fonts, spacing, borderRadius } from "@/theme";
import { ChainLink, ChainPlayer } from "../types/theChain.types";
import { ChainPlayerCard } from "./ChainPlayerCard";
import { ChainLinkRow } from "./ChainLinkRow";

export interface ChainProgressProps {
  /** Chain built so far (first element is start player wrapper) */
  chain: ChainLink[];
  /** Start player data */
  startPlayer: ChainPlayer;
  /** End player (goal) data */
  endPlayer: ChainPlayer;
  /** Whether the chain is complete (reached end player) */
  isComplete: boolean;
  /** Test ID for testing */
  testID?: string;
}

function ChainProgressComponent({
  chain,
  startPlayer,
  endPlayer,
  isComplete,
  testID,
}: ChainProgressProps) {
  // Links are all chain entries except the first (which is the start player wrapper)
  const links = chain.slice(1);

  // Check if the last link is the goal player (auto-completion scenario)
  // When a player links directly to the goal, we auto-add the goal to the chain
  // but we don't want to show it twice (in links AND as the goal card)
  const lastLinkIsGoal =
    links.length > 0 && links[links.length - 1]?.player.qid === endPlayer.qid;

  // If goal is in links, extract connection info and exclude from display
  const displayLinks = lastLinkIsGoal ? links.slice(0, -1) : links;
  const goalConnectionInfo = lastLinkIsGoal ? links[links.length - 1] : null;

  const goalYearRange = goalConnectionInfo
    ? goalConnectionInfo.overlap_start === goalConnectionInfo.overlap_end
      ? `${goalConnectionInfo.overlap_start}`
      : `${goalConnectionInfo.overlap_start}-${goalConnectionInfo.overlap_end}`
    : null;

  return (
    <View style={styles.container} testID={testID}>
      {/* Start Player Card */}
      <Animated.View entering={FadeInDown.delay(100).duration(400)}>
        <ChainPlayerCard
          player={startPlayer}
          variant="start"
          testID={`${testID}-start`}
        />
      </Animated.View>

      {/* Initial connector from start */}
      {displayLinks.length === 0 && !isComplete && (
        <View style={styles.initialConnector}>
          <View style={styles.connectorLineVertical}>
            <View style={[styles.connectorLineDashed]} />
          </View>
          <View style={styles.pendingLinkIndicator}>
            <Text style={styles.pendingText}>Add your first link</Text>
          </View>
        </View>
      )}

      {/* Chain Links */}
      {displayLinks.map((link, index) => (
        <ChainLinkRow
          key={`${link.player.qid}-${index}`}
          link={link}
          stepNumber={index + 1}
          isLatest={index === displayLinks.length - 1}
          isComplete={isComplete}
          testID={`${testID}-link-${index}`}
        />
      ))}

      {/* Connector to End Player (when not complete) */}
      {!isComplete && displayLinks.length > 0 && (
        <View style={styles.pendingConnector}>
          <View style={styles.connectorColumn}>
            <View style={styles.dottedLine}>
              {[0, 1, 2, 3, 4].map((i) => (
                <View key={i} style={styles.dot} />
              ))}
            </View>
          </View>
          <View style={styles.pendingGoalHint}>
            <Text style={styles.pendingGoalText}>
              Keep linking to reach the goal
            </Text>
          </View>
        </View>
      )}

      {/* Spacer to push GOAL to bottom */}
      <View style={styles.spacer} />

      {/* End Player Card Section */}
      <View style={styles.endPlayerSection}>
        {/* Final connector to goal */}
        {(displayLinks.length > 0 || goalConnectionInfo) && (
          <View style={styles.goalConnector}>
            <View style={styles.connectorColumn}>
              <View
                style={[
                  styles.connectorLineGoal,
                  !isComplete && styles.connectorLineDashedGoal,
                ]}
              />
            </View>
          </View>
        )}

        {/* Goal connection info - shown when auto-completed */}
        {isComplete && goalConnectionInfo && (
          <Animated.View
            entering={FadeIn.delay(200).duration(300)}
            style={styles.goalConnectionCard}
          >
            <View style={styles.goalConnectionHeader}>
              <Sparkles size={14} color={colors.cardYellow} />
              <Text style={styles.goalConnectionTitle}>Final Link!</Text>
            </View>
            <View style={styles.goalConnectionDetails}>
              <Link size={12} color={colors.cardYellow} />
              <Text style={styles.goalConnectionClub}>
                {goalConnectionInfo.shared_club_name}
              </Text>
              <View style={styles.goalYearBadge}>
                <Text style={styles.goalConnectionYears}>{goalYearRange}</Text>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Goal Player Card */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <ChainPlayerCard
            player={endPlayer}
            variant="end"
            isHighlighted={isComplete}
            testID={`${testID}-end`}
          />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
  },
  spacer: {
    // Fixed gap instead of flex:1 which was too greedy
    minHeight: spacing.md,
  },
  // Initial state (no links yet)
  initialConnector: {
    alignItems: "center",
    paddingVertical: spacing.md,
  },
  connectorLineVertical: {
    height: 40,
    alignItems: "center",
  },
  connectorLineDashed: {
    width: 3,
    height: "100%",
    backgroundColor: colors.textSecondary,
    opacity: 0.3,
    borderRadius: 1.5,
  },
  pendingLinkIndicator: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.glassBackground,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderStyle: "dashed",
    marginTop: spacing.sm,
  },
  pendingText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
  },
  // Pending connector (links exist but not complete)
  pendingConnector: {
    flexDirection: "row",
    paddingVertical: spacing.sm,
  },
  connectorColumn: {
    width: 40,
    alignItems: "center",
  },
  dottedLine: {
    alignItems: "center",
    gap: 6,
    paddingVertical: spacing.xs,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.textSecondary,
    opacity: 0.5,
  },
  pendingGoalHint: {
    flex: 1,
    justifyContent: "center",
    paddingLeft: spacing.sm,
  },
  pendingGoalText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: "italic",
  },
  // End player section
  endPlayerSection: {
    marginTop: spacing.xs,
  },
  goalConnector: {
    height: 24,
    marginBottom: spacing.xs,
  },
  connectorLineGoal: {
    width: 3,
    height: "100%",
    backgroundColor: colors.pitchGreen,
    borderRadius: 1.5,
  },
  connectorLineDashedGoal: {
    backgroundColor: colors.textSecondary,
    opacity: 0.3,
  },
  // Goal connection info card
  goalConnectionCard: {
    backgroundColor: "rgba(250, 204, 21, 0.1)",
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    marginLeft: 40, // Align with connector column
    borderWidth: 1,
    borderColor: "rgba(250, 204, 21, 0.3)",
  },
  goalConnectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  goalConnectionTitle: {
    fontFamily: fonts.headline,
    fontSize: 12,
    color: colors.cardYellow,
    letterSpacing: 0.5,
  },
  goalConnectionDetails: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  goalConnectionClub: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.cardYellow,
    fontWeight: "600",
    flex: 1,
  },
  goalYearBadge: {
    backgroundColor: "rgba(250, 204, 21, 0.2)",
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  goalConnectionYears: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.cardYellow,
    fontWeight: "500",
  },
});

export const ChainProgress = memo(ChainProgressComponent);
