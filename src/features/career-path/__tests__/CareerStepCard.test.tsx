import React from 'react';
import { render } from '@testing-library/react-native';
import { CareerStepCard } from '../components/CareerStepCard';
import { CareerStep } from '../types/careerPath.types';

// Mock dependencies
jest.mock('expo-blur', () => ({
  BlurView: ({ children }: any) => children,
}));

jest.mock('@/hooks/useHaptics', () => ({
  useHaptics: () => ({ triggerImpact: jest.fn() }),
}));

describe('CareerStepCard', () => {
  const mockStep: CareerStep = {
    text: 'Test Club',
    year: '2020-2023',
    endYear: 2023,
    type: 'club',
  };

  const currentYear = new Date().getFullYear();

  it('renders correctly when revealed', () => {
    const { getByText } = render(
      <CareerStepCard
        step={mockStep}
        stepNumber={1}
        isRevealed={true}
        isLatest={false}
      />
    );
    expect(getByText('Test Club')).toBeTruthy();
    expect(getByText('2020-2023')).toBeTruthy();
  });

  it('renders correctly when locked', () => {
    const { queryByText, getByTestId } = render(
      <CareerStepCard
        step={mockStep}
        stepNumber={2}
        isRevealed={false}
        isLatest={false}
        testID="locked-card"
      />
    );
    expect(queryByText('Test Club')).toBeNull();
    // LockedCard should be rendered
    expect(getByTestId('locked-card')).toBeTruthy();
  });

  it('renders "LOAN" badge for loan steps', () => {
    const loanStep: CareerStep = { ...mockStep, type: 'loan', text: 'Loan Club' };
    const { getByText } = render(
      <CareerStepCard
        step={loanStep}
        stepNumber={1}
        isRevealed={true}
        isLatest={true}
      />
    );
    expect(getByText('LOAN')).toBeTruthy();
    expect(getByText('Loan Club')).toBeTruthy();
  });

  it('renders correct year for current club (no endYear) without Current text', () => {
    const currentStep: CareerStep = { 
        ...mockStep, 
        text: 'Current Club', 
        year: '2023', // Start year
        endYear: null 
    };
    
    const { getByText, queryByText } = render(
      <CareerStepCard
        step={currentStep}
        stepNumber={3}
        isRevealed={true}
        isLatest={true}
      />
    );

    // Should NOT show "CURRENT" text anymore, used pulsing dot instead
    expect(queryByText('CURRENT')).toBeNull();
    // Should show year
    expect(getByText('2023')).toBeTruthy();
  });

  it('renders stats when provided', () => {
      const statsStep: CareerStep = {
          ...mockStep,
          apps: 20,
          goals: 5
      };

      const { getByText, queryByText } = render(
        <CareerStepCard
          step={statsStep}
          stepNumber={5}
          isRevealed={true}
          isLatest={false}
        />
      );
      
      expect(getByText('20')).toBeTruthy();
      expect(queryByText('Arts')).toBeNull(); // Correct negative assertion
      expect(getByText('20')).toBeTruthy();
      expect(queryByText('Arts')).toBeNull(); 
      expect(queryByText('Apps')).toBeNull(); // Replaced by icon
      expect(getByText('5')).toBeTruthy();
      expect(queryByText('Goals')).toBeNull(); // Replaced by icon
  });
});
