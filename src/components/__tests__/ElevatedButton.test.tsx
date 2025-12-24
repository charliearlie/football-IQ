import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ElevatedButton } from '../ElevatedButton';

describe('ElevatedButton', () => {
  it('renders with the provided title', () => {
    const { getAllByText } = render(
      <ElevatedButton title="Play Now" onPress={() => {}} />
    );

    // Button renders text twice (shadow layer + top layer)
    expect(getAllByText('Play Now').length).toBeGreaterThanOrEqual(1);
  });

  it('calls onPress when pressed', () => {
    const mockOnPress = jest.fn();
    const { getByTestId } = render(
      <ElevatedButton title="Play Now" onPress={mockOnPress} testID="btn" />
    );

    fireEvent.press(getByTestId('btn'));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const mockOnPress = jest.fn();
    const { getByTestId } = render(
      <ElevatedButton title="Play Now" onPress={mockOnPress} disabled testID="btn" />
    );

    fireEvent.press(getByTestId('btn'));
    expect(mockOnPress).not.toHaveBeenCalled();
  });

  it('renders with different sizes', () => {
    const { rerender, getAllByText } = render(
      <ElevatedButton title="Small" onPress={() => {}} size="small" />
    );
    expect(getAllByText('Small').length).toBeGreaterThanOrEqual(1);

    rerender(
      <ElevatedButton title="Medium" onPress={() => {}} size="medium" />
    );
    expect(getAllByText('Medium').length).toBeGreaterThanOrEqual(1);

    rerender(
      <ElevatedButton title="Large" onPress={() => {}} size="large" />
    );
    expect(getAllByText('Large').length).toBeGreaterThanOrEqual(1);
  });

  it('has correct accessibility properties', () => {
    const { getByRole } = render(
      <ElevatedButton title="Submit" onPress={() => {}} />
    );

    const button = getByRole('button');
    expect(button).toBeTruthy();
    expect(button.props.accessibilityLabel).toBe('Submit');
  });

  it('indicates disabled state via accessibility', () => {
    const { getByRole } = render(
      <ElevatedButton title="Submit" onPress={() => {}} disabled />
    );

    const button = getByRole('button');
    expect(button.props.accessibilityState).toEqual({ disabled: true });
  });

  it('uses testID prop correctly', () => {
    const { getByTestId } = render(
      <ElevatedButton
        title="Test Button"
        onPress={() => {}}
        testID="test-button"
      />
    );

    expect(getByTestId('test-button')).toBeTruthy();
  });
});
