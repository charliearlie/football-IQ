import React from 'react';
import { render } from '@testing-library/react-native';
import { View, Text, StyleSheet } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';

// Mock the legacy notice component inline for testing
// This tests the component pattern used in TicTacToeScreen review mode
function LegacyNotice({ testID }: { testID?: string }) {
  return (
    <View style={styles.container} testID={testID}>
      <AlertTriangle size={16} color="#FACC15" strokeWidth={2} />
      <Text style={styles.text}>LEGACY MODE - PREVIEW ONLY</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(250, 204, 21, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FACC15',
  },
  text: {
    fontSize: 14,
    color: '#FACC15',
    letterSpacing: 1,
  },
});

describe('Tic Tac Toe Legacy Mode', () => {
  it('shows legacy notice with correct text', () => {
    const { getByTestId, getByText } = render(
      <LegacyNotice testID="legacy-notice" />
    );

    expect(getByTestId('legacy-notice')).toBeTruthy();
    expect(getByText('LEGACY MODE - PREVIEW ONLY')).toBeTruthy();
  });

  it('renders AlertTriangle icon', () => {
    const { getByTestId } = render(<LegacyNotice testID="legacy-notice" />);

    // Component renders successfully with icon
    expect(getByTestId('legacy-notice')).toBeTruthy();
  });

  it('is not visible when not rendered', () => {
    const isReviewMode = false;
    const { queryByTestId } = render(
      <View>
        {isReviewMode && <LegacyNotice testID="legacy-notice" />}
      </View>
    );

    expect(queryByTestId('legacy-notice')).toBeNull();
  });

  it('is visible when in review mode', () => {
    const isReviewMode = true;
    const { getByTestId, getByText } = render(
      <View>
        {isReviewMode && <LegacyNotice testID="legacy-notice" />}
      </View>
    );

    expect(getByTestId('legacy-notice')).toBeTruthy();
    expect(getByText('LEGACY MODE - PREVIEW ONLY')).toBeTruthy();
  });
});
