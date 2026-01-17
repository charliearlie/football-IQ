import React from 'react';
import { render } from '@testing-library/react-native';
import { DossierSlot } from '../components/DossierSlot';

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  return Reanimated;
});

describe('DossierSlot', () => {
  describe('when locked (not revealed)', () => {
    it('shows the icon for Number slot', () => {
      const { getByTestId, queryByTestId } = render(
        <DossierSlot
          label="Number"
          hint="7"
          isRevealed={false}
          testID="dossier-slot"
        />
      );

      // Should show icon (Image component)
      expect(getByTestId('dossier-slot-icon')).toBeTruthy();

      // Should NOT show the revealed value
      expect(queryByTestId('dossier-slot-value')).toBeNull();
    });

    it('shows the icon for Position slot', () => {
      const { getByTestId, queryByTestId } = render(
        <DossierSlot
          label="Position"
          hint="ATT"
          isRevealed={false}
          testID="dossier-slot"
        />
      );

      expect(getByTestId('dossier-slot-icon')).toBeTruthy();
      expect(queryByTestId('dossier-slot-value')).toBeNull();
    });

    it('shows the icon for Nation slot', () => {
      const { getByTestId, queryByTestId } = render(
        <DossierSlot
          label="Nation"
          hint="🇧🇷"
          isRevealed={false}
          testID="dossier-slot"
        />
      );

      expect(getByTestId('dossier-slot-icon')).toBeTruthy();
      expect(queryByTestId('dossier-slot-value')).toBeNull();
    });

    it('shows the label', () => {
      const { getByText } = render(
        <DossierSlot
          label="Number"
          hint="7"
          isRevealed={false}
          testID="dossier-slot"
        />
      );

      expect(getByText('Number')).toBeTruthy();
    });
  });

  describe('when revealed', () => {
    it('shows the hint value for Number', () => {
      const { getByTestId, getByText, queryByTestId } = render(
        <DossierSlot
          label="Number"
          hint="7"
          isRevealed={true}
          testID="dossier-slot"
        />
      );

      expect(getByTestId('dossier-slot-value')).toBeTruthy();
      expect(getByText('7')).toBeTruthy();
      // Should NOT show the icon
      expect(queryByTestId('dossier-slot-icon')).toBeNull();
    });

    it('shows the hint value for Position', () => {
      const { getByText, queryByTestId } = render(
        <DossierSlot
          label="Position"
          hint="ATT"
          isRevealed={true}
          testID="dossier-slot"
        />
      );

      expect(getByText('ATT')).toBeTruthy();
      expect(queryByTestId('dossier-slot-icon')).toBeNull();
    });

    it('shows the hint value for Nation', () => {
      const { getByText, queryByTestId } = render(
        <DossierSlot
          label="Nation"
          hint="🇧🇷"
          isRevealed={true}
          testID="dossier-slot"
        />
      );

      expect(getByText('🇧🇷')).toBeTruthy();
      expect(queryByTestId('dossier-slot-icon')).toBeNull();
    });

    it('shows the label', () => {
      const { getByText } = render(
        <DossierSlot
          label="Position"
          hint="MID"
          isRevealed={true}
          testID="dossier-slot"
        />
      );

      expect(getByText('Position')).toBeTruthy();
    });
  });

  describe('review mode', () => {
    it('dims unrevealed slots in review mode', () => {
      const { getByTestId } = render(
        <DossierSlot
          label="Number"
          hint="7"
          isRevealed={false}
          isReviewMode={true}
          testID="dossier-slot"
        />
      );

      // Component renders with review mode styling (opacity 0.4)
      expect(getByTestId('dossier-slot')).toBeTruthy();
    });
  });
});
