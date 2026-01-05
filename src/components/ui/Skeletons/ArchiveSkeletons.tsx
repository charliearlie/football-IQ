import { View, StyleSheet } from 'react-native';
import { GlassCard } from '@/components/GlassCard';
import { colors, spacing, borderRadius } from '@/theme';
import { SkeletonBox } from './SkeletonBase';

interface MonthHeaderSkeletonProps {
  /** Test ID for testing */
  testID?: string;
}

/**
 * MonthHeaderSkeleton - Skeleton placeholder for month section headers.
 *
 * Dimensions:
 * - Width: 140px
 * - Height: 24px (matches h2 line-height)
 * - Padding: vertical 12px, horizontal 4px
 */
export function MonthHeaderSkeleton({ testID }: MonthHeaderSkeletonProps) {
  return (
    <View style={styles.monthHeader} testID={testID}>
      <SkeletonBox width={140} height={24} radius={4} />
    </View>
  );
}

interface ArchiveCardSkeletonProps {
  /** Test ID for testing */
  testID?: string;
}

/**
 * ArchiveCardSkeleton - Skeleton placeholder for ArchivePuzzleCard.
 *
 * Dimensions:
 * - Icon: 44x44px circle
 * - Date: 80px x 12px
 * - Title: 100px x 16px
 * - Button: 60px x 32px
 * - Card margin-bottom: 8px (spacing.sm)
 */
export function ArchiveCardSkeleton({ testID }: ArchiveCardSkeletonProps) {
  return (
    <GlassCard style={styles.card} testID={testID}>
      <View style={styles.content}>
        {/* Left: Icon + Text placeholders */}
        <View style={styles.left}>
          {/* Icon placeholder - 44x44 circle */}
          <View style={styles.iconContainer}>
            <SkeletonBox width={44} height={44} circle />
          </View>

          {/* Text placeholders */}
          <View style={styles.textContainer}>
            {/* Date - 80px x 12px */}
            <SkeletonBox width={80} height={12} radius={4} style={styles.date} />
            {/* Title - 100px x 16px */}
            <SkeletonBox width={100} height={16} radius={4} />
          </View>
        </View>

        {/* Right: Button placeholder */}
        <View style={styles.right}>
          <SkeletonBox width={60} height={32} radius={16} />
        </View>
      </View>
    </GlassCard>
  );
}

interface ArchiveSkeletonListProps {
  /** Number of month sections to render (default: 2) */
  sections?: number;
  /** Number of cards per section (default: 3) */
  cardsPerSection?: number;
  /** Test ID for testing */
  testID?: string;
}

/**
 * ArchiveSkeletonList - Full skeleton layout for Archive screen.
 *
 * Renders multiple month sections with card placeholders.
 */
export function ArchiveSkeletonList({
  sections = 2,
  cardsPerSection = 3,
  testID,
}: ArchiveSkeletonListProps) {
  return (
    <View testID={testID}>
      {Array.from({ length: sections }).map((_, sectionIndex) => (
        <View key={`section-${sectionIndex}`}>
          <MonthHeaderSkeleton />
          {Array.from({ length: cardsPerSection }).map((_, cardIndex) => (
            <ArchiveCardSkeleton key={`card-${sectionIndex}-${cardIndex}`} />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  monthHeader: {
    paddingVertical: spacing.md, // 12px
    paddingHorizontal: spacing.xs, // 4px
    backgroundColor: colors.stadiumNavy,
  },
  card: {
    marginBottom: spacing.sm, // 8px
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md, // 12px
  },
  textContainer: {
    flex: 1,
  },
  date: {
    marginBottom: 4, // Gap between date and title
  },
  right: {
    marginLeft: spacing.md, // 12px
  },
});
