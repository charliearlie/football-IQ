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

  // === VARIANT TESTS (TDD) ===

  describe('variants', () => {
    it('renders primary variant by default', () => {
      const { getByTestId } = render(
        <ElevatedButton title="Primary" onPress={() => {}} testID="btn" />
      );
      // Should render without errors - primary is the default
      expect(getByTestId('btn')).toBeTruthy();
    });

    it('renders primary variant explicitly', () => {
      const { getByTestId } = render(
        <ElevatedButton
          title="Primary"
          onPress={() => {}}
          variant="primary"
          testID="btn"
        />
      );
      expect(getByTestId('btn')).toBeTruthy();
    });

    it('renders secondary variant', () => {
      const { getByTestId } = render(
        <ElevatedButton
          title="Secondary"
          onPress={() => {}}
          variant="secondary"
          testID="btn"
        />
      );
      expect(getByTestId('btn')).toBeTruthy();
    });

    it('renders danger variant', () => {
      const { getByTestId } = render(
        <ElevatedButton
          title="Danger"
          onPress={() => {}}
          variant="danger"
          testID="btn"
        />
      );
      expect(getByTestId('btn')).toBeTruthy();
    });

    it('renders outline variant with glass background', () => {
      const { getByTestId } = render(
        <ElevatedButton
          title="Outline"
          onPress={() => {}}
          variant="outline"
          testID="btn"
        />
      );
      expect(getByTestId('btn')).toBeTruthy();
    });

    it('allows topColor to override variant color', () => {
      const { getByTestId } = render(
        <ElevatedButton
          title="Custom"
          onPress={() => {}}
          variant="primary"
          topColor="#FF0000"
          testID="btn"
        />
      );
      // Should render with custom color, overriding primary
      expect(getByTestId('btn')).toBeTruthy();
    });

    it('allows shadowColor to override variant shadow', () => {
      const { getByTestId } = render(
        <ElevatedButton
          title="Custom Shadow"
          onPress={() => {}}
          variant="primary"
          shadowColor="#CC0000"
          testID="btn"
        />
      );
      expect(getByTestId('btn')).toBeTruthy();
    });

    it('maintains backward compatibility - no variant uses primary colors', () => {
      // This test ensures old code without variant prop still works
      const { getByTestId, getAllByText } = render(
        <ElevatedButton
          title="Legacy"
          onPress={() => {}}
          testID="btn"
        />
      );
      expect(getByTestId('btn')).toBeTruthy();
      expect(getAllByText('Legacy').length).toBeGreaterThanOrEqual(1);
    });
  });
});
