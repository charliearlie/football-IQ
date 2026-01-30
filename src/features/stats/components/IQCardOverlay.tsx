/**
 * IQCardOverlay Component
 *
 * Modal overlay displaying a shareable IQ Card with:
 * - Global IQ score
 * - Current streak
 * - Top badge
 * - Global rank
 */

import React, { useRef, useState, useCallback } from "react";
import { View, Text, StyleSheet, Modal, Pressable } from "react-native";
import ViewShot from "react-native-view-shot";
import { X, Brain, Flame, Trophy, Award } from "lucide-react-native";
import Animated, { FadeIn, SlideInDown } from "react-native-reanimated";
import { colors, textStyles, spacing, borderRadius, fonts } from "@/theme";
import { ElevatedButton } from "@/components";
import { captureAndShareIQCard, IQCardData } from "../utils/shareIQ";

interface IQCardOverlayProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** IQ card data to display */
  data: IQCardData;
}

/**
 * Get tier color based on IQ score.
 */
function getTierColor(iq: number): string {
  if (iq >= 90) return "#FFD700"; // Gold - Elite
  if (iq >= 70) return colors.pitchGreen; // Green - Expert
  if (iq >= 50) return colors.cardYellow; // Yellow - Intermediate
  if (iq >= 30) return "#FF8C00"; // Orange - Apprentice
  return colors.textSecondary; // Gray - Rookie
}

/**
 * Get tier label based on IQ score.
 */
function getTierLabel(iq: number): string {
  if (iq >= 90) return "Elite";
  if (iq >= 70) return "Expert";
  if (iq >= 50) return "Intermediate";
  if (iq >= 30) return "Apprentice";
  return "Rookie";
}

/**
 * IQ Card visual component that gets captured as an image.
 */
function IQCard({ data }: { data: IQCardData }) {
  const tierColor = getTierColor(data.globalIQ);
  const tierLabel = getTierLabel(data.globalIQ);

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Football IQ</Text>
        <Text style={styles.cardSubtitle}>{data.displayName}</Text>
      </View>

      {/* Main IQ Score */}
      <View style={styles.scoreSection}>
        <Brain size={48} color={tierColor} />
        <Text style={[styles.iqScore, { color: tierColor }]}>
          {data.globalIQ}
        </Text>
        <View style={[styles.tierBadge, { backgroundColor: tierColor }]}>
          <Text style={styles.tierText}>{tierLabel}</Text>
        </View>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        {/* Rank */}
        {data.rank && (
          <View style={styles.statItem}>
            <Trophy size={20} color={colors.cardYellow} />
            <Text style={styles.statValue}>#{data.rank}</Text>
            <Text style={styles.statLabel}>Rank</Text>
          </View>
        )}

        {/* Streak */}
        <View style={styles.statItem}>
          <Flame size={20} color="#FF6B35" />
          <Text style={styles.statValue}>{data.currentStreak}</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </View>

        {/* Top Badge */}
        {data.topBadgeName && (
          <View style={styles.statItem}>
            <Award size={20} color={colors.pitchGreen} />
            <Text style={styles.statValue} numberOfLines={1}>
              {data.topBadgeName}
            </Text>
            <Text style={styles.statLabel}>Top Badge</Text>
          </View>
        )}
      </View>

      {/* Footer */}
      <View style={styles.cardFooter}>
        <Text style={styles.footerText}>football-iq-phi.vercel.app</Text>
      </View>
    </View>
  );
}

/**
 * Modal overlay for viewing and sharing the IQ Card.
 */
export function IQCardOverlay({ visible, onClose, data }: IQCardOverlayProps) {
  const viewShotRef = useRef<ViewShot>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [shareStatus, setShareStatus] = useState<"idle" | "shared" | "error">(
    "idle",
  );

  const handleShare = useCallback(async () => {
    setIsSharing(true);
    setShareStatus("idle");

    const result = await captureAndShareIQCard(viewShotRef, data);

    setIsSharing(false);

    if (result.success) {
      setShareStatus("shared");
      // Reset after 2 seconds
      setTimeout(() => setShareStatus("idle"), 2000);
    } else {
      setShareStatus("error");
    }
  }, [data]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View entering={FadeIn.duration(200)} style={styles.overlay}>
        <Animated.View
          entering={SlideInDown.springify().damping(15)}
          style={styles.container}
        >
          {/* Close Button */}
          <Pressable onPress={onClose} style={styles.closeButton} hitSlop={12}>
            <X size={24} color={colors.floodlightWhite} />
          </Pressable>

          {/* Title */}
          <Text style={styles.modalTitle}>Your IQ Card</Text>
          <Text style={styles.modalSubtitle}>
            Share your Football IQ with friends
          </Text>

          {/* Capturable Card */}
          <ViewShot
            ref={viewShotRef}
            options={{ format: "png", quality: 1 }}
            style={styles.viewShot}
          >
            <IQCard data={data} />
          </ViewShot>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <ElevatedButton
              title={
                isSharing
                  ? "Sharing..."
                  : shareStatus === "shared"
                    ? "Shared!"
                    : "Share IQ Card"
              }
              onPress={handleShare}
              disabled={isSharing}
              size="large"
            />
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  container: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: colors.stadiumNavy,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
  },
  closeButton: {
    position: "absolute",
    top: 60, // Increased to clear notch/status bar
    right: spacing.lg,
    zIndex: 1,
  },
  modalTitle: {
    ...textStyles.h1,
    color: colors.floodlightWhite,
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  modalSubtitle: {
    ...textStyles.body,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.xl,
  },
  viewShot: {
    borderRadius: borderRadius.lg,
    overflow: "hidden",
  },
  card: {
    backgroundColor: "#1a2744",
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    borderWidth: 2,
    borderColor: colors.pitchGreen,
  },
  cardHeader: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  cardTitle: {
    ...textStyles.h2,
    color: colors.pitchGreen,
    letterSpacing: 2,
  },
  cardSubtitle: {
    ...textStyles.body,
    color: colors.floodlightWhite,
    marginTop: spacing.xs,
  },
  scoreSection: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  iqScore: {
    fontSize: 80,
    fontFamily: fonts.headline,
    marginTop: spacing.sm,
    lineHeight: 88,
  },
  tierBadge: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginTop: spacing.sm,
  },
  tierText: {
    ...textStyles.body,
    color: colors.stadiumNavy,
    fontWeight: "700",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    ...textStyles.body,
    color: colors.floodlightWhite,
    fontWeight: "700",
    marginTop: spacing.xs,
  },
  statLabel: {
    ...textStyles.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  cardFooter: {
    alignItems: "center",
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
  },
  footerText: {
    ...textStyles.caption,
    color: colors.textSecondary,
    letterSpacing: 1,
  },
  actions: {
    marginTop: spacing.xl,
  },
});
