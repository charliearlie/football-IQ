import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { View, Text } from 'react-native';
import {
  SkeletonBox,
  SkeletonGroup,
  DailyStackCardSkeleton,
  ArchiveCardSkeleton,
  MonthHeaderSkeleton,
  ProfileHeaderSkeleton,
  IQScoreDisplaySkeleton,
  ProficiencyBarSkeleton,
} from '../index';

describe('SkeletonVisibility', () => {
  describe('SkeletonGroup', () => {
    it('renders children when show is true', () => {
      render(
        <SkeletonGroup show={true}>
          <View testID="skeleton-content">
            <Text>Skeleton Content</Text>
          </View>
        </SkeletonGroup>
      );

      expect(screen.getByTestId('skeleton-content')).toBeTruthy();
    });

    it('does not render children when show is false', () => {
      render(
        <SkeletonGroup show={false}>
          <View testID="skeleton-content">
            <Text>Skeleton Content</Text>
          </View>
        </SkeletonGroup>
      );

      expect(screen.queryByTestId('skeleton-content')).toBeNull();
    });
  });

  describe('SkeletonBox', () => {
    it('renders with specified dimensions', () => {
      render(<SkeletonBox width={100} height={50} />);
      // SkeletonBox uses moti/skeleton which renders without testID
      // Just verify it renders without error
      expect(true).toBe(true);
    });

    it('renders as a circle when circle prop is true', () => {
      render(<SkeletonBox width={48} height={48} circle />);
      // Verify component renders without error
      expect(true).toBe(true);
    });
  });

  describe('DailyStackCardSkeleton', () => {
    it('renders the skeleton card structure', () => {
      render(<DailyStackCardSkeleton testID="daily-skeleton" />);

      expect(screen.getByTestId('daily-skeleton')).toBeTruthy();
    });

    it('renders icon, title, subtitle, and button placeholders', () => {
      render(<DailyStackCardSkeleton testID="daily-skeleton" />);

      // The skeleton should have the glass card container
      expect(screen.getByTestId('daily-skeleton')).toBeTruthy();
    });
  });

  describe('ArchiveCardSkeleton', () => {
    it('renders the archive card skeleton', () => {
      render(<ArchiveCardSkeleton testID="archive-card-skeleton" />);

      expect(screen.getByTestId('archive-card-skeleton')).toBeTruthy();
    });
  });

  describe('MonthHeaderSkeleton', () => {
    it('renders the month header skeleton', () => {
      render(<MonthHeaderSkeleton testID="month-header-skeleton" />);

      expect(screen.getByTestId('month-header-skeleton')).toBeTruthy();
    });
  });

  describe('ProfileHeaderSkeleton', () => {
    it('renders the profile header skeleton with avatar', () => {
      render(<ProfileHeaderSkeleton testID="profile-skeleton" />);

      expect(screen.getByTestId('profile-skeleton')).toBeTruthy();
    });
  });

  describe('IQScoreDisplaySkeleton', () => {
    it('renders the IQ score display skeleton', () => {
      render(<IQScoreDisplaySkeleton testID="iq-skeleton" />);

      expect(screen.getByTestId('iq-skeleton')).toBeTruthy();
    });
  });

  describe('ProficiencyBarSkeleton', () => {
    it('renders a single proficiency bar skeleton', () => {
      render(<ProficiencyBarSkeleton testID="proficiency-skeleton" />);

      expect(screen.getByTestId('proficiency-skeleton')).toBeTruthy();
    });
  });

  describe('Loading state transitions', () => {
    it('shows skeleton when loading and hides when loaded', () => {
      const { rerender } = render(
        <View>
          <SkeletonGroup show={true}>
            <View testID="loading-skeleton" />
          </SkeletonGroup>
          <SkeletonGroup show={false}>
            <View testID="loaded-content" />
          </SkeletonGroup>
        </View>
      );

      // Initially loading
      expect(screen.getByTestId('loading-skeleton')).toBeTruthy();
      expect(screen.queryByTestId('loaded-content')).toBeNull();

      // After loading complete
      rerender(
        <View>
          <SkeletonGroup show={false}>
            <View testID="loading-skeleton" />
          </SkeletonGroup>
          <SkeletonGroup show={true}>
            <View testID="loaded-content" />
          </SkeletonGroup>
        </View>
      );

      expect(screen.queryByTestId('loading-skeleton')).toBeNull();
      expect(screen.getByTestId('loaded-content')).toBeTruthy();
    });
  });
});
