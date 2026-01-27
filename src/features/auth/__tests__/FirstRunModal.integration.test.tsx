import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { FirstRunModal } from '../components/FirstRunModal';

// Mock dependencies
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

// Create stable mock functions to prevent useEffect re-runs
const mockTriggerSuccess = jest.fn();
const mockTriggerNotification = jest.fn();

jest.mock('@/hooks/useHaptics', () => ({
  useHaptics: () => ({
    triggerSuccess: mockTriggerSuccess,
    triggerNotification: mockTriggerNotification,
  }),
}));

jest.mock('@sentry/react-native', () => ({
  captureMessage: jest.fn(),
}));

jest.mock('../components/BriefingBackground', () => ({
  BriefingBackground: () => null,
}));

jest.mock('../components/WeeklyFixturesGrid', () => ({
  WeeklyFixturesGrid: () => null,
}));

jest.mock('@/components/ElevatedButton', () => ({
  ElevatedButton: ({
    onPress,
    disabled,
    title,
    testID
  }: {
    onPress: () => void;
    disabled: boolean;
    title: string;
    testID?: string;
  }) => {
    const { TouchableOpacity, Text } = require('react-native');
    return (
      <TouchableOpacity onPress={onPress} disabled={disabled} testID={testID}>
        <Text>{title}</Text>
      </TouchableOpacity>
    );
  },
}));

describe('FirstRunModal Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders when visible is true', () => {
    const { getByText } = render(
      <FirstRunModal
        visible={true}
        onSubmit={jest.fn()}
        testID="modal"
      />
    );

    expect(getByText('WELCOME TO')).toBeTruthy();
    expect(getByText('FOOTBALL IQ')).toBeTruthy();
  });

  it('calls onSubmit with trimmed display name when form is submitted', async () => {
    const mockOnSubmit = jest.fn().mockResolvedValue(undefined);

    const { getByTestId } = render(
      <FirstRunModal
        visible={true}
        onSubmit={mockOnSubmit}
        testID="modal"
      />
    );

    // Enter display name with spaces
    const input = getByTestId('modal-content-input');
    fireEvent.changeText(input, '  TestUser  ');

    // Submit
    const button = getByTestId('modal-content-submit');
    fireEvent.press(button);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith('TestUser');
    });
  });

  it('disables submit button for short display name', () => {
    const mockOnSubmit = jest.fn();

    const { getByTestId } = render(
      <FirstRunModal
        visible={true}
        onSubmit={mockOnSubmit}
        testID="modal"
      />
    );

    // Enter short display name
    const input = getByTestId('modal-content-input');
    fireEvent.changeText(input, 'AB');

    // Button should be disabled
    const button = getByTestId('modal-content-submit');
    expect(button.props.accessibilityState?.disabled).toBe(true);

    // Pressing disabled button should not call onSubmit
    fireEvent.press(button);
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('enables submit button when display name is valid', () => {
    const { getByTestId } = render(
      <FirstRunModal
        visible={true}
        onSubmit={jest.fn()}
        testID="modal"
      />
    );

    // Enter valid display name (3+ characters)
    const input = getByTestId('modal-content-input');
    fireEvent.changeText(input, 'ABC');

    // Button should be enabled
    const button = getByTestId('modal-content-submit');
    expect(button.props.accessibilityState?.disabled).toBe(false);
  });

  it('shows external error message when error prop is provided', () => {
    const { getByText } = render(
      <FirstRunModal
        visible={true}
        onSubmit={jest.fn()}
        error="Failed to save. Please try again."
        testID="modal"
      />
    );

    expect(getByText('Failed to save. Please try again.')).toBeTruthy();
  });

  it('handles submission failure gracefully', async () => {
    const mockOnSubmit = jest.fn().mockRejectedValue(new Error('Network error'));

    const { getByTestId, getByText } = render(
      <FirstRunModal
        visible={true}
        onSubmit={mockOnSubmit}
        testID="modal"
      />
    );

    // Enter valid display name
    const input = getByTestId('modal-content-input');
    fireEvent.changeText(input, 'TestUser');

    // Submit
    const button = getByTestId('modal-content-submit');
    fireEvent.press(button);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
    });

    // Should show error message
    await waitFor(() => {
      expect(getByText('Something went wrong. Please try again.')).toBeTruthy();
    });
  });

  it('disables submit button while submitting', async () => {
    // Create a promise that we can control
    let resolveSubmit: () => void;
    const submitPromise = new Promise<void>((resolve) => {
      resolveSubmit = resolve;
    });
    const mockOnSubmit = jest.fn().mockReturnValue(submitPromise);

    const { getByTestId, getByText } = render(
      <FirstRunModal
        visible={true}
        onSubmit={mockOnSubmit}
        testID="modal"
      />
    );

    // Enter valid display name
    const input = getByTestId('modal-content-input');
    fireEvent.changeText(input, 'TestUser');

    // Submit
    const button = getByTestId('modal-content-submit');
    fireEvent.press(button);

    // Button should show "Starting..." while submitting
    await waitFor(() => {
      expect(getByText('Starting...')).toBeTruthy();
    });

    // Resolve the promise
    resolveSubmit!();

    // Button should return to normal
    await waitFor(() => {
      expect(getByText('START YOUR CAREER')).toBeTruthy();
    });
  });

  it('clears external error when user types in input', async () => {
    const { getByTestId, getByText, queryByText } = render(
      <FirstRunModal
        visible={true}
        onSubmit={jest.fn()}
        error="Failed to save. Please try again."
        testID="modal"
      />
    );

    // External error should be shown
    expect(getByText('Failed to save. Please try again.')).toBeTruthy();

    // Type in input to clear error
    const input = getByTestId('modal-content-input');
    fireEvent.changeText(input, 'NewName');

    // Error should be cleared after typing
    await waitFor(() => {
      expect(queryByText('Failed to save. Please try again.')).toBeNull();
    });
  });
});
