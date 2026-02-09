import React from 'react';
import { render } from '@testing-library/react-native';
import { DossierSlot } from '../components/DossierSlot';

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  return Reanimated;
});

// Mock FlagIcon component
jest.mock('@/components/FlagIcon', () => ({
  FlagIcon: ({ code, testID }: { code: string; testID?: string }) => {
    const { View, Text } = require('react-native');
    return (
      <View testID={testID}>
        <Text>{code}</Text>
      </View>
    );
  },
}));

// Mock lucide-react-native icons
jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  const MockIcon = (props: { testID?: string }) => <View {...props} />;
  return {
    Calendar: MockIcon,
    Shirt: MockIcon,
    Flag: MockIcon,
    Lock: MockIcon,
  };
});

describe('DossierSlot', () => {
  describe('when locked (not revealed)', () => {
    it('shows the icon for Year slot', () => {
      const { getByTestId, queryByTestId } = render(
        <DossierSlot
          label="Year"
          hint="2019"
          isRevealed={false}
          testID="dossier-slot"
        />
      );

      // Should show icon
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
          hint="BR"
          isRevealed={false}
          testID="dossier-slot"
        />
      );

      expect(getByTestId('dossier-slot-icon')).toBeTruthy();
      expect(queryByTestId('dossier-slot-value')).toBeNull();
    });

    it('shows the uppercase label', () => {
      const { getByText } = render(
        <DossierSlot
          label="Year"
          hint="2019"
          isRevealed={false}
          testID="dossier-slot"
        />
      );

      expect(getByText('YEAR')).toBeTruthy();
    });
  });

  describe('when revealed', () => {
    it('shows the hint value for Year', () => {
      const { getByTestId, getByText, queryByTestId } = render(
        <DossierSlot
          label="Year"
          hint="2019"
          isRevealed={true}
          testID="dossier-slot"
        />
      );

      expect(getByTestId('dossier-slot-value')).toBeTruthy();
      expect(getByText('2019')).toBeTruthy();
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

    it('shows FlagIcon for Nation hint with ISO code', () => {
      const { getByTestId, queryByTestId } = render(
        <DossierSlot
          label="Nation"
          hint="BR"
          isRevealed={true}
          testID="dossier-slot"
        />
      );

      // Should render FlagIcon, not text
      expect(getByTestId('dossier-slot-flag')).toBeTruthy();
      expect(queryByTestId('dossier-slot-icon')).toBeNull();
    });

    it('shows FlagIcon for GB home nation code', () => {
      const { getByTestId } = render(
        <DossierSlot
          label="Nation"
          hint="GB-ENG"
          isRevealed={true}
          testID="dossier-slot"
        />
      );

      expect(getByTestId('dossier-slot-flag')).toBeTruthy();
    });

    it('falls back to text for legacy emoji flag hint', () => {
      const { getByTestId, getByText } = render(
        <DossierSlot
          label="Nation"
          hint="\u{1F1E7}\u{1F1F7}"
          isRevealed={true}
          testID="dossier-slot"
        />
      );

      // Legacy emoji should fall back to text display
      expect(getByTestId('dossier-slot-value')).toBeTruthy();
    });

    it('shows the uppercase category label at bottom', () => {
      const { getByText } = render(
        <DossierSlot
          label="Position"
          hint="MID"
          isRevealed={true}
          testID="dossier-slot"
        />
      );

      expect(getByText('POSITION')).toBeTruthy();
    });
  });

  describe('review mode', () => {
    it('dims unrevealed slots in review mode', () => {
      const { getByTestId } = render(
        <DossierSlot
          label="Year"
          hint="2019"
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
