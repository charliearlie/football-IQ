/**
 * Win Condition Tests for Tic Tac Toe
 *
 * Verifies the 8 possible winning combinations (3 rows, 3 columns, 2 diagonals).
 */

import {
  checkWin,
  checkDraw,
  getEmptyCells,
  countCells,
  calculateScore,
  createEmptyCells,
} from '../utils/gameLogic';
import type { CellState, CellArray } from '../types/ticTacToe.types';

// Helper to create a cell
const cell = (owner: 'player' | 'ai' | null, name: string | null = null): CellState => ({
  owner,
  playerName: name,
});

// Helper to create a board from a simple string representation
// X = player, O = ai, . = empty
function createBoard(pattern: string): CellArray {
  const chars = pattern.replace(/\s/g, '').split('');
  return chars.map((c) => {
    if (c === 'X') return cell('player', 'Player');
    if (c === 'O') return cell('ai', 'AI');
    return cell(null);
  }) as CellArray;
}

describe('checkWin', () => {
  describe('Row wins', () => {
    it('should detect top row win (0, 1, 2)', () => {
      const cells = createBoard(`
        XXX
        OO.
        ...
      `);

      const result = checkWin(cells, 'player');

      expect(result).toEqual([0, 1, 2]);
    });

    it('should detect middle row win (3, 4, 5)', () => {
      const cells = createBoard(`
        OO.
        XXX
        ...
      `);

      const result = checkWin(cells, 'player');

      expect(result).toEqual([3, 4, 5]);
    });

    it('should detect bottom row win (6, 7, 8)', () => {
      const cells = createBoard(`
        OO.
        ...
        XXX
      `);

      const result = checkWin(cells, 'player');

      expect(result).toEqual([6, 7, 8]);
    });

    it('should detect AI top row win', () => {
      const cells = createBoard(`
        OOO
        XX.
        ...
      `);

      const result = checkWin(cells, 'ai');

      expect(result).toEqual([0, 1, 2]);
    });
  });

  describe('Column wins', () => {
    it('should detect left column win (0, 3, 6)', () => {
      const cells = createBoard(`
        XO.
        XO.
        X..
      `);

      const result = checkWin(cells, 'player');

      expect(result).toEqual([0, 3, 6]);
    });

    it('should detect middle column win (1, 4, 7)', () => {
      const cells = createBoard(`
        OX.
        OX.
        .X.
      `);

      const result = checkWin(cells, 'player');

      expect(result).toEqual([1, 4, 7]);
    });

    it('should detect right column win (2, 5, 8)', () => {
      const cells = createBoard(`
        OOX
        ..X
        ..X
      `);

      const result = checkWin(cells, 'player');

      expect(result).toEqual([2, 5, 8]);
    });

    it('should detect AI right column win', () => {
      const cells = createBoard(`
        XXO
        ..O
        ..O
      `);

      const result = checkWin(cells, 'ai');

      expect(result).toEqual([2, 5, 8]);
    });
  });

  describe('Diagonal wins', () => {
    it('should detect main diagonal win (0, 4, 8)', () => {
      const cells = createBoard(`
        XO.
        OX.
        ..X
      `);

      const result = checkWin(cells, 'player');

      expect(result).toEqual([0, 4, 8]);
    });

    it('should detect anti-diagonal win (2, 4, 6)', () => {
      const cells = createBoard(`
        OOX
        .X.
        X..
      `);

      const result = checkWin(cells, 'player');

      expect(result).toEqual([2, 4, 6]);
    });

    it('should detect AI main diagonal win', () => {
      const cells = createBoard(`
        OX.
        XO.
        ..O
      `);

      const result = checkWin(cells, 'ai');

      expect(result).toEqual([0, 4, 8]);
    });

    it('should detect AI anti-diagonal win', () => {
      const cells = createBoard(`
        XXO
        .O.
        O..
      `);

      const result = checkWin(cells, 'ai');

      expect(result).toEqual([2, 4, 6]);
    });
  });

  describe('No win scenarios', () => {
    it('should return null for empty board', () => {
      const cells = createEmptyCells();

      expect(checkWin(cells, 'player')).toBeNull();
      expect(checkWin(cells, 'ai')).toBeNull();
    });

    it('should return null for partial game', () => {
      const cells = createBoard(`
        XO.
        .X.
        O..
      `);

      expect(checkWin(cells, 'player')).toBeNull();
      expect(checkWin(cells, 'ai')).toBeNull();
    });

    it('should return null for draw board', () => {
      const cells = createBoard(`
        XOX
        XOO
        OXX
      `);

      expect(checkWin(cells, 'player')).toBeNull();
      expect(checkWin(cells, 'ai')).toBeNull();
    });
  });
});

describe('checkDraw', () => {
  it('should return true for a full board with no winner', () => {
    const cells = createBoard(`
      XOX
      XOO
      OXX
    `);

    expect(checkDraw(cells)).toBe(true);
  });

  it('should return false for empty board', () => {
    const cells = createEmptyCells();

    expect(checkDraw(cells)).toBe(false);
  });

  it('should return false for partial board', () => {
    const cells = createBoard(`
      XO.
      .X.
      O..
    `);

    expect(checkDraw(cells)).toBe(false);
  });

  it('should return false when player has won (even if board is full)', () => {
    const cells = createBoard(`
      XXX
      OOX
      OXO
    `);

    // Player won top row, not a draw
    expect(checkDraw(cells)).toBe(false);
  });

  it('should return false when AI has won', () => {
    const cells = createBoard(`
      OOO
      XXO
      XOX
    `);

    // AI won top row, not a draw
    expect(checkDraw(cells)).toBe(false);
  });
});

describe('getEmptyCells', () => {
  it('should return all 9 indices for empty board', () => {
    const cells = createEmptyCells();

    const emptyCells = getEmptyCells(cells);

    expect(emptyCells).toHaveLength(9);
    expect(emptyCells).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('should return empty array for full board', () => {
    const cells = createBoard(`
      XOX
      XOO
      OXX
    `);

    expect(getEmptyCells(cells)).toEqual([]);
  });

  it('should return correct empty indices for partial board', () => {
    const cells = createBoard(`
      XO.
      ...
      ..X
    `);

    const emptyCells = getEmptyCells(cells);

    expect(emptyCells).toEqual([2, 3, 4, 5, 6, 7]);
  });
});

describe('countCells', () => {
  it('should count player cells correctly', () => {
    const cells = createBoard(`
      XOX
      .X.
      O.X
    `);

    expect(countCells(cells, 'player')).toBe(4);
  });

  it('should count AI cells correctly', () => {
    const cells = createBoard(`
      XOX
      .X.
      O.X
    `);

    expect(countCells(cells, 'ai')).toBe(2);
  });

  it('should count empty cells correctly', () => {
    const cells = createBoard(`
      XOX
      .X.
      O.X
    `);

    expect(countCells(cells, null)).toBe(3);
  });
});

describe('calculateScore', () => {
  it('should return 10 points for a win', () => {
    const cells = createBoard(`
      XXX
      OO.
      ...
    `);

    const score = calculateScore('win', cells);

    expect(score.points).toBe(10);
    expect(score.maxPoints).toBe(10);
    expect(score.result).toBe('win');
    expect(score.playerCells).toBe(3);
    expect(score.aiCells).toBe(2);
  });

  it('should return 5 points for a draw', () => {
    const cells = createBoard(`
      XOX
      XOO
      OXX
    `);

    const score = calculateScore('draw', cells);

    expect(score.points).toBe(5);
    expect(score.result).toBe('draw');
    expect(score.playerCells).toBe(5);
    expect(score.aiCells).toBe(4);
  });

  it('should return 0 points for a loss', () => {
    const cells = createBoard(`
      OOO
      XX.
      X..
    `);

    const score = calculateScore('loss', cells);

    expect(score.points).toBe(0);
    expect(score.result).toBe('loss');
    expect(score.playerCells).toBe(3);
    expect(score.aiCells).toBe(3);
  });
});

describe('createEmptyCells', () => {
  it('should create array of 9 empty cells', () => {
    const cells = createEmptyCells();

    expect(cells).toHaveLength(9);
    cells.forEach((cell) => {
      expect(cell.owner).toBeNull();
      expect(cell.playerName).toBeNull();
    });
  });
});
