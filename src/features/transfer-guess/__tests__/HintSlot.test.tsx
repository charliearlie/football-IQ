import React from 'react';
import { render } from '@testing-library/react-native';
import { HintSlot } from '../components/HintSlot';

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  return Reanimated;
});

describe('HintSlot', () => {
  describe('when locked (not revealed)', () => {
    it('shows placeholder icon for Number', () => {
      const { getByText, queryByText } = render(
        <HintSlot
          label="Number"
          hint="7"
          isRevealed={false}
          slotNumber={1}
          testID="hint-slot"
        />
      );

      // Should show # placeholder
      expect(getByText('#')).toBeTruthy();

      // Should NOT show the actual hint text
      expect(queryByText('7')).toBeNull();
    });

    it('shows placeholder icon for Position', () => {
      const { getByText, queryByText } = render(
        <HintSlot
          label="Position"
          hint="ATT"
          isRevealed={false}
          slotNumber={2}
          testID="hint-slot"
        />
      );

      // Should show ⚽ placeholder
      expect(getByText('⚽')).toBeTruthy();
      expect(queryByText('ATT')).toBeNull();
    });

    it('shows placeholder icon for Nation', () => {
      const { getByText, queryByText } = render(
        <HintSlot
          label="Nation"
          hint="🇧🇷"
          isRevealed={false}
          slotNumber={3}
          testID="hint-slot"
        />
      );

      // Should show 🏴 placeholder
      expect(getByText('🏴')).toBeTruthy();
      expect(queryByText('🇧🇷')).toBeNull();
    });

    it('shows the label', () => {
      const { getByText } = render(
        <HintSlot
          label="Number"
          hint="7"
          isRevealed={false}
          slotNumber={1}
          testID="hint-slot"
        />
      );

      expect(getByText('Number')).toBeTruthy();
    });
  });

  describe('when revealed', () => {
    it('shows the hint value for Number', () => {
      const { getByText, getByTestId, queryByText } = render(
        <HintSlot
          label="Number"
          hint="7"
          isRevealed={true}
          slotNumber={1}
          testID="hint-slot"
        />
      );

      expect(getByTestId('hint-slot-hint-text')).toBeTruthy();
      expect(getByText('7')).toBeTruthy();
      // Should NOT show placeholder
      expect(queryByText('#')).toBeNull();
    });

    it('shows the hint value for Position', () => {
      const { getByText, queryByText } = render(
        <HintSlot
          label="Position"
          hint="ATT"
          isRevealed={true}
          slotNumber={2}
          testID="hint-slot"
        />
      );

      expect(getByText('ATT')).toBeTruthy();
      expect(queryByText('⚽')).toBeNull();
    });

    it('shows the hint value for Nation', () => {
      const { getByText, queryByText } = render(
        <HintSlot
          label="Nation"
          hint="🇧🇷"
          isRevealed={true}
          slotNumber={3}
          testID="hint-slot"
        />
      );

      expect(getByText('🇧🇷')).toBeTruthy();
      expect(queryByText('🏴')).toBeNull();
    });

    it('shows the label', () => {
      const { getByText } = render(
        <HintSlot
          label="Position"
          hint="MID"
          isRevealed={true}
          slotNumber={2}
          testID="hint-slot"
        />
      );

      expect(getByText('Position')).toBeTruthy();
    });
  });
});
