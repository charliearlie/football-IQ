/**
 * TicTacToeGrid Component
 *
 * The full 3x3 grid with row and column category headers.
 * Handles cell layout and winning line overlay.
 */

import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { colors, spacing, borderRadius, fonts } from '@/theme';
import { GridCell } from './GridCell';
import type {
  CellIndex,
  CellArray,
  TicTacToeContent,
} from '../types/ticTacToe.types';

export interface TicTacToeGridProps {
  /** Current cell states */
  cells: CellArray;
  /** Puzzle content with categories */
  puzzleContent: TicTacToeContent;
  /** Currently selected cell index */
  selectedCell: CellIndex | null;
  /** Winning line indices (if game won) */
  winningLine: [CellIndex, CellIndex, CellIndex] | null;
  /** Whether it's the player's turn */
  isPlayerTurn: boolean;
  /** Whether the game is over */
  isGameOver: boolean;
  /** Winner (for showing winning line color) */
  winner: 'player' | 'ai' | null;
  /** Callback when a cell is pressed */
  onCellPress: (index: CellIndex) => void;
}

const CELL_SIZE = 90;
const CELL_GAP = 8;
const HEADER_WIDTH = 80;
const GRID_SIZE = CELL_SIZE * 3 + CELL_GAP * 2;

/**
 * TicTacToeGrid - Main grid component with categories
 */
export function TicTacToeGrid({
  cells,
  puzzleContent,
  selectedCell,
  winningLine,
  isPlayerTurn,
  isGameOver,
  winner,
  onCellPress,
}: TicTacToeGridProps) {
  const { rows, columns } = puzzleContent;

  // Animation for winning line
  const lineScale = useSharedValue(0);
  const lineOpacity = useSharedValue(0);

  // Trigger winning line animation
  if (winningLine && lineScale.value === 0) {
    lineOpacity.value = withTiming(1, { duration: 200 });
    lineScale.value = withDelay(
      100,
      withSpring(1, { damping: 12, stiffness: 100 })
    );
  }

  // Determine winning line position and rotation
  const getWinningLineStyle = () => {
    if (!winningLine) return null;

    const [a, , c] = winningLine;

    // Check for rows
    if (a === 0 && c === 2) return { rotation: 0, row: 0 };
    if (a === 3 && c === 5) return { rotation: 0, row: 1 };
    if (a === 6 && c === 8) return { rotation: 0, row: 2 };

    // Check for columns
    if (a === 0 && c === 6) return { rotation: 90, col: 0 };
    if (a === 1 && c === 7) return { rotation: 90, col: 1 };
    if (a === 2 && c === 8) return { rotation: 90, col: 2 };

    // Check for diagonals
    if (a === 0 && c === 8) return { rotation: 45, diagonal: 'main' };
    if (a === 2 && c === 6) return { rotation: -45, diagonal: 'anti' };

    return null;
  };

  const lineConfig = getWinningLineStyle();

  const animatedLineStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scaleX: lineScale.value }],
      opacity: lineOpacity.value,
    };
  });

  // Calculate line position based on winning combination
  const getLinePosition = () => {
    if (!lineConfig) return {};

    const cellWithGap = CELL_SIZE + CELL_GAP;
    const halfCell = CELL_SIZE / 2;

    if ('row' in lineConfig && lineConfig.row !== undefined) {
      return {
        top: lineConfig.row * cellWithGap + halfCell - 4,
        left: 0,
        right: 0,
        height: 8,
      };
    }

    if ('col' in lineConfig && lineConfig.col !== undefined) {
      return {
        left: lineConfig.col * cellWithGap + halfCell - 4,
        top: 0,
        bottom: 0,
        width: 8,
      };
    }

    if ('diagonal' in lineConfig) {
      const diagonalLength = Math.sqrt(2) * GRID_SIZE;
      return {
        width: diagonalLength,
        height: 8,
        top: GRID_SIZE / 2 - 4,
        left: GRID_SIZE / 2 - diagonalLength / 2,
        transform: [
          { rotate: lineConfig.diagonal === 'main' ? '45deg' : '-45deg' },
        ],
      };
    }

    return {};
  };

  const renderCell = (index: CellIndex) => {
    const isWinningCell = winningLine?.includes(index) ?? false;

    return (
      <GridCell
        key={index}
        index={index}
        cell={cells[index]}
        isSelected={selectedCell === index}
        isPlayerTurn={isPlayerTurn}
        isWinningCell={isWinningCell}
        onPress={onCellPress}
        isGameOver={isGameOver}
      />
    );
  };

  return (
    <View style={styles.container}>
      {/* Column Headers (top) */}
      <View style={styles.columnHeadersRow}>
        {/* Empty corner */}
        <View style={styles.cornerSpacer} />

        {columns.map((col, i) => (
          <View key={`col-${i}`} style={styles.columnHeader}>
            <Text style={styles.headerText} numberOfLines={2}>
              {col}
            </Text>
          </View>
        ))}
      </View>

      {/* Grid with Row Headers */}
      <View style={styles.gridRow}>
        {/* Row Headers (left side) */}
        <View style={styles.rowHeaders}>
          {rows.map((row, i) => (
            <View key={`row-${i}`} style={styles.rowHeader}>
              <Text style={styles.headerText} numberOfLines={2}>
                {row}
              </Text>
            </View>
          ))}
        </View>

        {/* The Grid */}
        <View style={styles.grid}>
          {/* Grid cells */}
          <View style={styles.gridContent}>
            {/* Row 0 */}
            <View style={styles.gridRowCells}>
              {renderCell(0)}
              {renderCell(1)}
              {renderCell(2)}
            </View>

            {/* Row 1 */}
            <View style={styles.gridRowCells}>
              {renderCell(3)}
              {renderCell(4)}
              {renderCell(5)}
            </View>

            {/* Row 2 */}
            <View style={styles.gridRowCells}>
              {renderCell(6)}
              {renderCell(7)}
              {renderCell(8)}
            </View>
          </View>

          {/* Winning line overlay */}
          {winningLine && lineConfig && (
            <Animated.View
              style={[
                styles.winningLine,
                {
                  backgroundColor:
                    winner === 'player' ? colors.pitchGreen : colors.redCard,
                },
                getLinePosition(),
                animatedLineStyle,
              ]}
            />
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  columnHeadersRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  cornerSpacer: {
    width: HEADER_WIDTH,
  },
  columnHeader: {
    width: CELL_SIZE,
    marginHorizontal: CELL_GAP / 2,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: spacing.xs,
  },
  headerText: {
    fontFamily: fonts.headline,
    fontSize: 16,
    color: colors.floodlightWhite,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  gridRow: {
    flexDirection: 'row',
  },
  rowHeaders: {
    width: HEADER_WIDTH,
    justifyContent: 'space-around',
    paddingRight: spacing.sm,
  },
  rowHeader: {
    height: CELL_SIZE,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  grid: {
    position: 'relative',
  },
  gridContent: {
    gap: CELL_GAP,
  },
  gridRowCells: {
    flexDirection: 'row',
    gap: CELL_GAP,
  },
  winningLine: {
    position: 'absolute',
    borderRadius: borderRadius.full,
    transformOrigin: 'center',
  },
});
