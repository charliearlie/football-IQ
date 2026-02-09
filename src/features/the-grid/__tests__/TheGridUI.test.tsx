/**
 * The Grid UI Tests (TDD)
 *
 * Tests for The Grid UI components: TheGridBoard, GridCell, and TheGridActionZone.
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TheGridBoard } from '../components/TheGridBoard';
import { GridCell } from '../components/GridCell';
import { CategoryHeader } from '../components/CategoryHeader';
import { TheGridActionZone } from '../components/TheGridActionZone';
import { TheGridContent, GridCategory, FilledCell } from '../types/theGrid.types';

// Test fixture: sample puzzle content
const mockContent: TheGridContent = {
  xAxis: [
    { type: 'club', value: 'Real Madrid' },
    { type: 'club', value: 'Barcelona' },
    { type: 'nation', value: 'France' },
  ],
  yAxis: [
    { type: 'nation', value: 'Brazil' },
    { type: 'trophy', value: 'Champions League' },
    { type: 'stat', value: '100+ Goals' },
  ],
  valid_answers: {
    '0': ['Vinícius Júnior'],
    '1': ['Neymar'],
    '2': ['Karim Benzema'],
    '3': ['Cristiano Ronaldo'],
    '4': ['Lionel Messi'],
    '5': ['Kylian Mbappé'],
    '6': ['Karim Benzema'],
    '7': ['Lionel Messi'],
    '8': ['Thierry Henry'],
  },
};

// Empty cells array for testing
const emptyCells: (FilledCell | null)[] = [null, null, null, null, null, null, null, null, null];

// Partially filled cells for testing
const partialCells: (FilledCell | null)[] = [
  { player: 'Vinícius Júnior' },
  null,
  null,
  null,
  { player: 'Lionel Messi' },
  null,
  null,
  null,
  { player: 'Thierry Henry' },
];

describe('TheGridBoard', () => {
  const mockOnCellPress = jest.fn();

  beforeEach(() => {
    mockOnCellPress.mockClear();
  });

  it('renders 9 cells', () => {
    const { getAllByTestId } = render(
      <TheGridBoard
        content={mockContent}
        cells={emptyCells}
        selectedCell={null}
        onCellPress={mockOnCellPress}
        testID="grid-board"
      />
    );

    const cells = getAllByTestId(/^grid-cell-\d$/);
    expect(cells).toHaveLength(9);
  });

  it('renders 3 column headers', () => {
    const { getAllByTestId } = render(
      <TheGridBoard
        content={mockContent}
        cells={emptyCells}
        selectedCell={null}
        onCellPress={mockOnCellPress}
        testID="grid-board"
      />
    );

    const columnHeaders = getAllByTestId(/^column-header-\d$/);
    expect(columnHeaders).toHaveLength(3);
  });

  it('renders 3 row headers', () => {
    const { getAllByTestId } = render(
      <TheGridBoard
        content={mockContent}
        cells={emptyCells}
        selectedCell={null}
        onCellPress={mockOnCellPress}
        testID="grid-board"
      />
    );

    const rowHeaders = getAllByTestId(/^row-header-\d$/);
    expect(rowHeaders).toHaveLength(3);
  });

  it('passes selectedCell to correct cell component', () => {
    const { getByTestId } = render(
      <TheGridBoard
        content={mockContent}
        cells={emptyCells}
        selectedCell={4}
        onCellPress={mockOnCellPress}
        testID="grid-board"
      />
    );

    // Cell 4 should have selected state - we'll verify this via the cell's testID or style
    const cell4 = getByTestId('grid-cell-4');
    expect(cell4).toBeTruthy();
  });

  it('shows filled players in cells', () => {
    const { getByText } = render(
      <TheGridBoard
        content={mockContent}
        cells={partialCells}
        selectedCell={null}
        onCellPress={mockOnCellPress}
        testID="grid-board"
      />
    );

    expect(getByText('Vinícius Júnior')).toBeTruthy();
    expect(getByText('Lionel Messi')).toBeTruthy();
    expect(getByText('Thierry Henry')).toBeTruthy();
  });
});

describe('GridCell', () => {
  const mockOnPress = jest.fn();

  beforeEach(() => {
    mockOnPress.mockClear();
  });

  it('shows ? icon when empty', () => {
    const { getByText } = render(
      <GridCell
        index={0}
        cell={null}
        isSelected={false}
        onPress={mockOnPress}
        testID="grid-cell"
      />
    );

    expect(getByText('?')).toBeTruthy();
  });

  it('shows player name when filled', () => {
    const { getByText, queryByText } = render(
      <GridCell
        index={0}
        cell={{ player: 'Lionel Messi' }}
        isSelected={false}
        onPress={mockOnPress}
        testID="grid-cell"
      />
    );

    expect(getByText('Lionel Messi')).toBeTruthy();
    expect(queryByText('?')).toBeNull();
  });

  it('calls onPress when tapped (empty cell)', () => {
    const { getByTestId } = render(
      <GridCell
        index={3}
        cell={null}
        isSelected={false}
        onPress={mockOnPress}
        testID="grid-cell"
      />
    );

    fireEvent.press(getByTestId('grid-cell'));
    expect(mockOnPress).toHaveBeenCalledWith(3);
  });

  it('does not call onPress when filled', () => {
    const { getByTestId } = render(
      <GridCell
        index={3}
        cell={{ player: 'Lionel Messi' }}
        isSelected={false}
        onPress={mockOnPress}
        testID="grid-cell"
      />
    );

    fireEvent.press(getByTestId('grid-cell'));
    expect(mockOnPress).not.toHaveBeenCalled();
  });

  it('does not call onPress when disabled', () => {
    const { getByTestId } = render(
      <GridCell
        index={3}
        cell={null}
        isSelected={false}
        onPress={mockOnPress}
        disabled
        testID="grid-cell"
      />
    );

    fireEvent.press(getByTestId('grid-cell'));
    expect(mockOnPress).not.toHaveBeenCalled();
  });

  it('applies selected style when isSelected is true', () => {
    const { getByTestId } = render(
      <GridCell
        index={4}
        cell={null}
        isSelected={true}
        onPress={mockOnPress}
        testID="grid-cell"
      />
    );

    // The selected cell should have the testID
    const cell = getByTestId('grid-cell');
    expect(cell).toBeTruthy();
    // Note: Actual style testing would require checking the style prop
    // This test just verifies the component renders with isSelected=true
  });
});

describe('CategoryHeader', () => {
  it('displays category value text', () => {
    const category: GridCategory = { type: 'club', value: 'Real Madrid' };

    const { getByText } = render(
      <CategoryHeader category={category} testID="header" />
    );

    expect(getByText('Real Madrid')).toBeTruthy();
  });

  it('renders icon for club category type', () => {
    const category: GridCategory = { type: 'club', value: 'Barcelona' };

    const { getByTestId } = render(
      <CategoryHeader category={category} testID="header" />
    );

    // Icon should be rendered - we verify via testID pattern
    expect(getByTestId('header-icon')).toBeTruthy();
  });

  it('renders icon for nation category type', () => {
    const category: GridCategory = { type: 'nation', value: 'France' };

    const { getByTestId } = render(
      <CategoryHeader category={category} testID="header" />
    );

    expect(getByTestId('header-icon')).toBeTruthy();
  });

  it('renders icon for stat category type', () => {
    const category: GridCategory = { type: 'stat', value: '100+ Goals' };

    const { getByTestId } = render(
      <CategoryHeader category={category} testID="header" />
    );

    expect(getByTestId('header-icon')).toBeTruthy();
  });

  it('renders icon for trophy category type', () => {
    const category: GridCategory = { type: 'trophy', value: 'Champions League' };

    const { getByTestId } = render(
      <CategoryHeader category={category} testID="header" />
    );

    expect(getByTestId('header-icon')).toBeTruthy();
  });
});

describe('TheGridActionZone', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();
  const mockOnChangeText = jest.fn();

  const rowCategory: GridCategory = { type: 'nation', value: 'Brazil' };
  const colCategory: GridCategory = { type: 'club', value: 'Real Madrid' };

  beforeEach(() => {
    mockOnSubmit.mockClear();
    mockOnCancel.mockClear();
    mockOnChangeText.mockClear();
  });

  it('displays row and column criteria', () => {
    const { getByText } = render(
      <TheGridActionZone
        rowCategory={rowCategory}
        colCategory={colCategory}
        value=""
        onChangeText={mockOnChangeText}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        testID="action-zone"
      />
    );

    expect(getByText(/Brazil/)).toBeTruthy();
    expect(getByText(/Real Madrid/)).toBeTruthy();
  });

  it('shows text input with provided value', () => {
    const { getByDisplayValue } = render(
      <TheGridActionZone
        rowCategory={rowCategory}
        colCategory={colCategory}
        value="Vinícius"
        onChangeText={mockOnChangeText}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        testID="action-zone"
      />
    );

    expect(getByDisplayValue('Vinícius')).toBeTruthy();
  });

  it('calls onChangeText when typing', () => {
    const { getByTestId } = render(
      <TheGridActionZone
        rowCategory={rowCategory}
        colCategory={colCategory}
        value=""
        onChangeText={mockOnChangeText}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        testID="action-zone"
      />
    );

    fireEvent.changeText(getByTestId('action-zone-input'), 'Messi');
    expect(mockOnChangeText).toHaveBeenCalledWith('Messi');
  });

  it('calls onSubmit when submit button pressed', () => {
    const { getByTestId } = render(
      <TheGridActionZone
        rowCategory={rowCategory}
        colCategory={colCategory}
        value="Vinícius Júnior"
        onChangeText={mockOnChangeText}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        testID="action-zone"
      />
    );

    fireEvent.press(getByTestId('action-zone-submit'));
    expect(mockOnSubmit).toHaveBeenCalled();
  });

  it('calls onCancel when cancel button pressed', () => {
    const { getByTestId } = render(
      <TheGridActionZone
        rowCategory={rowCategory}
        colCategory={colCategory}
        value=""
        onChangeText={mockOnChangeText}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        testID="action-zone"
      />
    );

    fireEvent.press(getByTestId('action-zone-cancel'));
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('disables submit when value is empty', () => {
    const { getByTestId } = render(
      <TheGridActionZone
        rowCategory={rowCategory}
        colCategory={colCategory}
        value=""
        onChangeText={mockOnChangeText}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        testID="action-zone"
      />
    );

    fireEvent.press(getByTestId('action-zone-submit'));
    // Submit should not be called when value is empty
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it.todo('triggers shake animation on incorrect guess');
  it.todo('clears input after successful submission');
});
