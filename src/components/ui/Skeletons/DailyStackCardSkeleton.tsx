import { View, StyleSheet } from 'react-native';
import { GlassCard } from '@/components/GlassCard';
import { spacing } from '@/theme';
import { SkeletonBox } from './SkeletonBase';

interface DailyStackCardSkeletonProps {
  /** Test ID for testing */
  testID?: string;
}

/**
 * DailyStackCardSkeleton - Skeleton placeholder for DailyStackCard.
 *
 * Matches exact dimensions:
 * - GlassCard wrapper: 16px padding, 16px border-radius
 * - Icon placeholder: 48x48px circle
 * - Title placeholder: 120px x 18px
 * - Subtitle placeholder: 80px x 12px
 * - Button placeholder: 60px x 32px
 * - Card margin-bottom: 12px (spacing.md)
 */
export function DailyStackCardSkeleton({ testID }: DailyStackCardSkeletonProps) {
  return (
    <GlassCard style={styles.card} testID={testID}>
      <View style={styles.content}>
        {/* Left: Icon + Text placeholders */}
        <View style={styles.left}>
          {/* Icon placeholder - 48x48 circle */}
          <View style={styles.iconContainer}>
            <SkeletonBox width={48} height={48} circle />
          </View>

          {/* Text placeholders */}
          <View style={styles.textContainer}>
            {/* Title - 120px x 18px */}
            <SkeletonBox width={120} height={18} radius={4} style={styles.title} />
            {/* Subtitle - 80px x 12px */}
            <SkeletonBox width={80} height={12} radius={4} />
          </View>
        </View>

        {/* Right: Button placeholder - 60px x 32px */}
        <View style={styles.right}>
          <SkeletonBox width={60} height={32} radius={16} />
        </View>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md, // 12px
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm, // 8px
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md, // 12px
  },
  textContainer: {
    flex: 1,
  },
  title: {
    marginBottom: 6, // Gap between title and subtitle
  },
  right: {
    marginLeft: spacing.md, // 12px
  },
});
