import React from 'react';
import { render } from '@testing-library/react-native';
import { CareerStepCard } from '@/features/career-path/components/CareerStepCard';
import { CareerStep } from '@/features/career-path/types/careerPath.types';

// Mock expo-blur
jest.mock('expo-blur', () => ({
  BlurView: 'BlurView',
}));

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

describe('Review Mode - Career Path Narrative', () => {
  const mockClubStep: CareerStep = {
    type: 'club',
    text: 'Manchester United',
    year: '2020-2023',
  };

  const mockLoanStep: CareerStep = {
    type: 'loan',
    text: 'Sevilla',
    year: '2021-2022',
  };

  describe('Winning Step Highlight', () => {
    it('renders success highlight on winning step (won on Step 2)', () => {
      const { getByTestId } = render(
        <CareerStepCard
          step={mockClubStep}
          stepNumber={2}
          isRevealed={true}
          isLatest={false}
          isWinningStep={true}
          testID="winning-step"
        />
      );

      const card = getByTestId('winning-step');
      // The component should render with winning step props
      expect(card).toBeTruthy();
    });

    it('does not show winning highlight on non-winning steps', () => {
      const { getByTestId, queryByTestId } = render(
        <CareerStepCard
          step={mockClubStep}
          stepNumber={1}
          isRevealed={true}
          isLatest={false}
          isWinningStep={false}
          testID="regular-step"
        />
      );

      const card = getByTestId('regular-step');
      expect(card).toBeTruthy();
      // Winning badge should not exist
      expect(queryByTestId('winning-badge')).toBeNull();
    });

    it('shows winning badge with checkmark icon on winning step', () => {
      const { getByTestId } = render(
        <CareerStepCard
          step={mockClubStep}
          stepNumber={3}
          isRevealed={true}
          isLatest={false}
          isWinningStep={true}
          testID="winning-step-with-badge"
        />
      );

      // Should have a winning badge indicator
      const winningBadge = getByTestId('winning-badge');
      expect(winningBadge).toBeTruthy();
    });
  });

  describe('Missed Step Badge', () => {
    it('shows "MISSED" badge on final step when lost', () => {
      const { getByTestId, getByText } = render(
        <CareerStepCard
          step={mockClubStep}
          stepNumber={5}
          isRevealed={true}
          isLatest={false}
          isMissedStep={true}
          testID="missed-step"
        />
      );

      // Should render the card
      expect(getByTestId('missed-step')).toBeTruthy();
      // Should have the "MISSED" badge
      expect(getByTestId('missed-badge')).toBeTruthy();
      expect(getByText('MISSED')).toBeTruthy();
    });

    it('does not show missed badge on regular steps', () => {
      const { getByTestId, queryByTestId, queryByText } = render(
        <CareerStepCard
          step={mockClubStep}
          stepNumber={3}
          isRevealed={true}
          isLatest={false}
          isMissedStep={false}
          testID="regular-step"
        />
      );

      expect(getByTestId('regular-step')).toBeTruthy();
      expect(queryByTestId('missed-badge')).toBeNull();
      expect(queryByText('MISSED')).toBeNull();
    });

    it('does not show missed badge when step is not marked as missed', () => {
      const { queryByTestId } = render(
        <CareerStepCard
          step={mockClubStep}
          stepNumber={5}
          isRevealed={true}
          isLatest={false}
          isMissedStep={undefined}
          testID="no-missed-prop"
        />
      );

      expect(queryByTestId('missed-badge')).toBeNull();
    });
  });

  describe('Combined States', () => {
    it('winning step takes precedence over latest styling', () => {
      const { getByTestId } = render(
        <CareerStepCard
          step={mockClubStep}
          stepNumber={2}
          isRevealed={true}
          isLatest={true}
          isWinningStep={true}
          testID="winning-and-latest"
        />
      );

      // Should show winning badge, not just latest styling
      expect(getByTestId('winning-badge')).toBeTruthy();
    });

    it('loan badge still appears alongside winning step styling', () => {
      const { getByTestId, getByText } = render(
        <CareerStepCard
          step={mockLoanStep}
          stepNumber={3}
          isRevealed={true}
          isLatest={false}
          isWinningStep={true}
          testID="loan-winning-step"
        />
      );

      // Should have both loan badge and winning badge
      expect(getByText('LOAN')).toBeTruthy();
      expect(getByTestId('winning-badge')).toBeTruthy();
    });
  });
});
