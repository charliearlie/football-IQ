import React from 'react';
import { render } from '@testing-library/react-native';
import { HintSlot } from '../components/HintSlot';

// Mock expo-blur
jest.mock('expo-blur', () => ({
  BlurView: 'BlurView',
}));

// Mock lucide-react-native
jest.mock('lucide-react-native', () => ({
  Lock: 'Lock',
}));

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  return Reanimated;
});

describe('HintSlot', () => {
  describe('when locked (not revealed)', () => {
    it('shows placeholder text instead of hint', () => {
      const { getByText, queryByText } = render(
        <HintSlot
          label="Nationality"
          hint="Brazilian"
          isRevealed={false}
          slotNumber={1}
          testID="hint-slot"
        />
      );

      // Should show placeholder
      expect(getByText('???')).toBeTruthy();

      // Should NOT show the actual hint text
      expect(queryByText('Brazilian')).toBeNull();
    });

    it('shows the slot number', () => {
      const { getByText } = render(
        <HintSlot
          label="Position"
          hint="Forward"
          isRevealed={false}
          slotNumber={2}
          testID="hint-slot"
        />
      );

      expect(getByText('2')).toBeTruthy();
    });

    it('shows the label', () => {
      const { getByText } = render(
        <HintSlot
          label="Achievement"
          hint="World Cup Winner"
          isRevealed={false}
          slotNumber={3}
          testID="hint-slot"
        />
      );

      expect(getByText('Achievement')).toBeTruthy();
    });
  });

  describe('when revealed', () => {
    it('shows the hint text', () => {
      const { getByText, getByTestId } = render(
        <HintSlot
          label="Nationality"
          hint="Brazilian"
          isRevealed={true}
          slotNumber={1}
          testID="hint-slot"
        />
      );

      // Should show the actual hint
      expect(getByTestId('hint-slot-hint-text')).toBeTruthy();
      expect(getByText('Brazilian')).toBeTruthy();
    });

    it('shows the label', () => {
      const { getByText } = render(
        <HintSlot
          label="Position"
          hint="Striker"
          isRevealed={true}
          slotNumber={2}
          testID="hint-slot"
        />
      );

      expect(getByText('Position')).toBeTruthy();
    });

    it('shows the slot number', () => {
      const { getByText } = render(
        <HintSlot
          label="Achievement"
          hint="Ballon d'Or"
          isRevealed={true}
          slotNumber={3}
          testID="hint-slot"
        />
      );

      expect(getByText('3')).toBeTruthy();
    });

    it('does not show placeholder text', () => {
      const { queryByText } = render(
        <HintSlot
          label="Nationality"
          hint="Brazilian"
          isRevealed={true}
          slotNumber={1}
          testID="hint-slot"
        />
      );

      expect(queryByText('???')).toBeNull();
    });
  });
});
