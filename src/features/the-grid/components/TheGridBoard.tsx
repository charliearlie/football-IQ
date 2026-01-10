/**
 * TheGridBoard Component
 *
 * The 3x3 grid with category headers on top and left.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, spacing } from '@/theme';
import { TheGridContent, FilledCell, CellIndex } from '../types/theGrid.types';
import { CategoryHeader } from './CategoryHeader';
import { GridCell } from './GridCell';

export interface TheGridBoardProps {
  content: TheGridContent;
  cells: (FilledCell | null)[];
  selectedCell: CellIndex | null;
  onCellPress: (index: CellIndex) => void;
  disabled?: boolean;
  testID?: string;
}

/**
 * TheGridBoard - The main 3x3 grid with category headers.
 *
 * Layout:
 * ```
 *           |  Col0  |  Col1  |  Col2  |
 * ----------|--------|--------|--------|
 *    Row0   |   0    |   1    |   2    |
 * ----------|--------|--------|--------|
 *    Row1   |   3    |   4    |   5    |
 * ----------|--------|--------|--------|
 *    Row2   |   6    |   7    |   8    |
 * ```
 */
export function TheGridBoard({
  content,
  cells,
  selectedCell,
  onCellPress,
  disabled = false,
  testID,
}: TheGridBoardProps) {
  return (
    <View style={styles.container} testID={testID}>
      {/* Column headers row */}
      <View style={styles.headerRow}>
        {/* Empty corner cell */}
        <View style={styles.cornerCell} />

        {/* Column headers */}
        {content.xAxis.map((category, colIndex) => (
          <View key={`col-${colIndex}`} style={styles.columnHeader}>
            <CategoryHeader
              category={category}
              orientation="vertical"
              testID={`column-header-${colIndex}`}
            />
          </View>
        ))}
      </View>

      {/* Grid rows */}
      {[0, 1, 2].map((rowIndex) => (
        <View key={`row-${rowIndex}`} style={styles.gridRow}>
          {/* Row header */}
          <View style={styles.rowHeader}>
            <CategoryHeader
              category={content.yAxis[rowIndex]}
              orientation="horizontal"
              testID={`row-header-${rowIndex}`}
            />
          </View>

          {/* Row cells */}
          {[0, 1, 2].map((colIndex) => {
            const cellIndex = (rowIndex * 3 + colIndex) as CellIndex;
            return (
              <View key={`cell-${cellIndex}`} style={styles.cellWrapper}>
                <GridCell
                  index={cellIndex}
                  cell={cells[cellIndex]}
                  isSelected={selectedCell === cellIndex}
                  onPress={onCellPress}
                  disabled={disabled}
                  testID={`grid-cell-${cellIndex}`}
                />
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const CELL_SIZE = 90;
const GAP = 8;
const HEADER_WIDTH = 80;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: GAP,
  },
  cornerCell: {
    width: HEADER_WIDTH,
    height: 50,
  },
  columnHeader: {
    width: CELL_SIZE,
    height: 50,
    marginHorizontal: GAP / 2,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: GAP,
  },
  rowHeader: {
    width: HEADER_WIDTH,
    height: CELL_SIZE,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: spacing.sm,
  },
  cellWrapper: {
    marginHorizontal: GAP / 2,
  },
});
