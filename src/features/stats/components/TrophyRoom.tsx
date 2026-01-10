/**
 * Trophy Room Component
 *
 * Horizontal scrollable list of earned and unearned badges.
 * Tapping opens a full modal view of all badges.
 */

import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
} from 'react-native';
import Animated, { SlideInDown } from 'react-native-reanimated';
import {
  Flame,
  Search,
  DollarSign,
  Clock,
  Grid3X3,
  MessageCircle,
  Award,
  Trophy,
  X,
  Lock,
  LucideIcon,
} from 'lucide-react-native';
import { colors, textStyles, spacing, borderRadius, fonts } from '@/theme';
import { GlassCard } from '@/components';
import { Badge } from '../types/stats.types';

interface TrophyRoomProps {
  badges: Badge[];
}

/**
 * Get icon component by name.
 */
function getIconByName(iconName: string): LucideIcon {
  const icons: Record<string, LucideIcon> = {
    Flame,
    Search,
    DollarSign,
    Clock,
    Grid3X3,
    MessageCircle,
    Award,
    Trophy,
  };
  return icons[iconName] || Award;
}

interface BadgeItemProps {
  badge: Badge;
}

function BadgeItem({ badge }: BadgeItemProps) {
  const IconComponent = getIconByName(badge.icon);
  const isEarned = badge.earnedAt !== null;

  return (
    <View style={[styles.badgeContainer, !isEarned && styles.badgeUnearned]}>
      <View
        style={[
          styles.badgeIcon,
          isEarned ? styles.badgeIconEarned : styles.badgeIconUnearned,
        ]}
      >
        <IconComponent
          color={isEarned ? colors.stadiumNavy : colors.textSecondary}
          size={24}
          strokeWidth={2}
        />
      </View>
      <Text
        style={[
          textStyles.caption,
          styles.badgeName,
          !isEarned && styles.badgeNameUnearned,
        ]}
        numberOfLines={2}
      >
        {badge.name}
      </Text>
    </View>
  );
}

/**
 * Modal item with larger badge display and description.
 */
interface ModalBadgeItemProps {
  badge: Badge;
}

function ModalBadgeItem({ badge }: ModalBadgeItemProps) {
  const IconComponent = getIconByName(badge.icon);
  const isEarned = badge.earnedAt !== null;

  return (
    <View style={[styles.modalBadgeContainer, !isEarned && styles.modalBadgeUnearned]}>
      <View
        style={[
          styles.modalBadgeIcon,
          isEarned ? styles.modalBadgeIconEarned : styles.modalBadgeIconUnearned,
        ]}
      >
        {isEarned ? (
          <IconComponent
            color={colors.stadiumNavy}
            size={32}
            strokeWidth={2}
          />
        ) : (
          <Lock
            color={colors.textSecondary}
            size={24}
            strokeWidth={2}
          />
        )}
      </View>
      <View style={styles.modalBadgeInfo}>
        <Text
          style={[
            styles.modalBadgeName,
            !isEarned && styles.modalBadgeNameUnearned,
          ]}
        >
          {badge.name}
        </Text>
        <Text
          style={[
            styles.modalBadgeDescription,
            !isEarned && styles.modalBadgeDescriptionUnearned,
          ]}
        >
          {badge.description}
        </Text>
        {isEarned && badge.earnedAt && (
          <Text style={styles.modalBadgeDate}>
            Earned {formatEarnedDate(badge.earnedAt)}
          </Text>
        )}
      </View>
    </View>
  );
}

/**
 * Format earned date for display.
 */
function formatEarnedDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Trophy Room Modal showing all badges in detail.
 */
interface TrophyRoomModalProps {
  visible: boolean;
  onClose: () => void;
  badges: Badge[];
}

function TrophyRoomModal({ visible, onClose, badges }: TrophyRoomModalProps) {
  const earnedCount = badges.filter((b) => b.earnedAt !== null).length;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Animated.View
          entering={SlideInDown.springify().damping(15).stiffness(100)}
          style={styles.modalContent}
        >
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleContainer}>
              <Trophy size={24} color={colors.cardYellow} />
              <Text style={styles.modalTitle}>Trophy Room</Text>
            </View>
            <Pressable
              onPress={onClose}
              style={styles.closeButton}
              hitSlop={12}
              accessibilityLabel="Close"
              accessibilityRole="button"
            >
              <X size={24} color={colors.floodlightWhite} />
            </Pressable>
          </View>

          {/* Progress */}
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>
              {earnedCount} of {badges.length} badges earned
            </Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${(earnedCount / badges.length) * 100}%` },
                ]}
              />
            </View>
          </View>

          {/* Badge List */}
          <ScrollView
            style={styles.modalScrollView}
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {badges.map((badge) => (
              <ModalBadgeItem key={badge.id} badge={badge} />
            ))}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

export function TrophyRoom({ badges }: TrophyRoomProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const earnedCount = badges.filter((b) => b.earnedAt !== null).length;

  const handleOpen = useCallback(() => {
    setModalVisible(true);
  }, []);

  const handleClose = useCallback(() => {
    setModalVisible(false);
  }, []);

  return (
    <>
      <Pressable onPress={handleOpen} accessibilityRole="button">
        <GlassCard style={styles.container}>
          <View style={styles.header}>
            <Text style={[textStyles.h3, styles.title]}>Trophy Room</Text>
            <Text style={[textStyles.caption, styles.count]}>
              {earnedCount}/{badges.length}
            </Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            scrollEnabled={false}
            pointerEvents="none"
          >
            {badges.map((badge) => (
              <BadgeItem key={badge.id} badge={badge} />
            ))}
          </ScrollView>
          <Text style={styles.tapHint}>Tap to view all badges</Text>
        </GlassCard>
      </Pressable>

      <TrophyRoomModal
        visible={modalVisible}
        onClose={handleClose}
        badges={badges}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {},
  count: {
    color: colors.pitchGreen,
  },
  scrollContent: {
    gap: spacing.md,
    paddingRight: spacing.lg,
  },
  badgeContainer: {
    alignItems: 'center',
    width: 72,
  },
  badgeUnearned: {
    opacity: 0.4,
  },
  badgeIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  badgeIconEarned: {
    backgroundColor: colors.cardYellow,
  },
  badgeIconUnearned: {
    backgroundColor: colors.glassBackground,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  badgeName: {
    textAlign: 'center',
    color: colors.floodlightWhite,
  },
  badgeNameUnearned: {
    color: colors.textSecondary,
  },
  tapHint: {
    ...textStyles.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.stadiumNavy,
    borderRadius: borderRadius['2xl'],
    borderWidth: 2,
    borderColor: colors.cardYellow,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  modalTitle: {
    fontFamily: fonts.headline,
    fontSize: 24,
    color: colors.floodlightWhite,
    letterSpacing: 1,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glassBackground,
    borderRadius: 20,
  },
  progressContainer: {
    padding: spacing.lg,
    paddingTop: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
  },
  progressText: {
    ...textStyles.body,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.glassBackground,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.cardYellow,
    borderRadius: 4,
  },
  modalScrollView: {
    flex: 1,
  },
  modalScrollContent: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  modalBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glassBackground,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  modalBadgeUnearned: {
    opacity: 0.6,
  },
  modalBadgeIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBadgeIconEarned: {
    backgroundColor: colors.cardYellow,
  },
  modalBadgeIconUnearned: {
    backgroundColor: colors.glassBorder,
  },
  modalBadgeInfo: {
    flex: 1,
  },
  modalBadgeName: {
    fontFamily: fonts.headline,
    fontSize: 16,
    color: colors.floodlightWhite,
    marginBottom: 2,
  },
  modalBadgeNameUnearned: {
    color: colors.textSecondary,
  },
  modalBadgeDescription: {
    ...textStyles.caption,
    color: colors.textSecondary,
  },
  modalBadgeDescriptionUnearned: {
    color: colors.textSecondary,
    opacity: 0.7,
  },
  modalBadgeDate: {
    ...textStyles.caption,
    color: colors.pitchGreen,
    marginTop: spacing.xs,
  },
});
