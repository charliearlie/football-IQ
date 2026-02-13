import React from 'react';
import { render } from '@testing-library/react-native';
import { ArchiveHeader } from '../components/ArchiveHeader';

describe('ArchiveHeader', () => {
  it('renders the title and subtitle', () => {
    const { getByText } = render(
      <ArchiveHeader completedCount={5} totalCount={20} />
    );

    expect(getByText('ARCHIVE')).toBeTruthy();
    expect(getByText('YOUR SEASON HISTORY')).toBeTruthy();
  });

  it('renders the stats label', () => {
    const { getByText } = render(
      <ArchiveHeader completedCount={5} totalCount={20} />
    );

    expect(getByText('GAMES COMPLETED')).toBeTruthy();
  });

  it('displays completed and total counts', () => {
    const { getByText } = render(
      <ArchiveHeader completedCount={12} totalCount={45} />
    );

    expect(getByText('12')).toBeTruthy();
    expect(getByText(' / 45')).toBeTruthy();
  });

  it('displays zero counts when no games played', () => {
    const { getByText } = render(
      <ArchiveHeader completedCount={0} totalCount={0} />
    );

    expect(getByText('0')).toBeTruthy();
    expect(getByText(' / 0')).toBeTruthy();
  });

  describe('skeleton loading state', () => {
    it('shows skeleton when loading with zero counts', () => {
      const { getByTestId, queryByText } = render(
        <ArchiveHeader completedCount={0} totalCount={0} isLoading={true} />
      );

      // SkeletonBox is mocked and renders with testID="skeleton-placeholder"
      expect(getByTestId('skeleton-placeholder')).toBeTruthy();

      // Should NOT render the score numbers
      expect(queryByText('0')).toBeNull();
      expect(queryByText(' / 0')).toBeNull();
    });

    it('shows counts (not skeleton) when loading but counts are available', () => {
      const { queryByTestId, getByText } = render(
        <ArchiveHeader completedCount={5} totalCount={20} isLoading={true} />
      );

      // Should NOT show skeleton when counts are non-zero
      expect(queryByTestId('skeleton-placeholder')).toBeNull();

      // Should show the actual counts
      expect(getByText('5')).toBeTruthy();
      expect(getByText(' / 20')).toBeTruthy();
    });

    it('shows counts when not loading', () => {
      const { queryByTestId, getByText } = render(
        <ArchiveHeader completedCount={3} totalCount={10} isLoading={false} />
      );

      expect(queryByTestId('skeleton-placeholder')).toBeNull();
      expect(getByText('3')).toBeTruthy();
      expect(getByText(' / 10')).toBeTruthy();
    });

    it('shows counts when isLoading is undefined (default)', () => {
      const { queryByTestId, getByText } = render(
        <ArchiveHeader completedCount={0} totalCount={0} />
      );

      // Without isLoading, should show "0 / 0" not skeleton
      expect(queryByTestId('skeleton-placeholder')).toBeNull();
      expect(getByText('0')).toBeTruthy();
      expect(getByText(' / 0')).toBeTruthy();
    });
  });
});
